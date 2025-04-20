from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status, Body
from bson import ObjectId

from app.models.user import User, UserUpdate, UserInDB
from app.core.security import get_password_hash
from app.core.errors import (
    ResourceNotFoundError,
    ResourceAlreadyExistsError,
    AuthorizationError,
    AuthenticationError,
    ValidationError,
)
from app.core.database import (
    users_collection,
    operators_collection,
    tickets_collection,
    reviews_collection,
    buses_collection,
    routes_collection,
)
from app.api import deps

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=User)
async def get_current_user(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Get current user information.
    """
    return current_user


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate, current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Update current user information.
    """
    # Build update dictionary with only provided fields
    update_dict = {
        k: v for k, v in user_update.dict(exclude_unset=True).items() if v is not None
    }

    # Handle password update separately
    if "password" in update_dict:
        update_dict["password"] = get_password_hash(update_dict["password"])

    # Prevent updating role directly
    if "role" in update_dict:
        raise AuthorizationError("Cannot update role directly")

    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()

        # Update user
        await users_collection.update_one(
            {"_id": current_user.id}, {"$set": update_dict}
        )

    # Get updated user
    updated_user = await users_collection.find_one({"_id": current_user.id})

    return User(**updated_user)


@router.get("/me/bookings", response_model=List[dict])
async def get_current_user_bookings(
    status: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user's bookings.
    """
    # Build query
    query = {"user_id": current_user.id}

    # Filter by status
    if status:
        query["status"] = status

    # Get tickets for current user
    cursor = tickets_collection.find(query).sort("created_at", -1)
    tickets = await cursor.to_list(length=100)

    # Enhance tickets with route details
    result = []
    for ticket in tickets:
        # Get route details
        route = await routes_collection.find_one({"_id": ticket["route_id"]})
        if route:
            # Clean up the result for API response
            ticket_dict = {
                "id": str(ticket["_id"]),
                "booking_reference": ticket["booking_reference"],
                "travel_date": ticket["travel_date"],
                "seat_number": ticket["seat_number"],
                "price": ticket["price"],
                "status": ticket["status"],
                "payment_status": ticket["payment"]["status"],
                "created_at": ticket["created_at"],
                "route": {
                    "id": str(route["_id"]),
                    "start_location": route["start_location"]["name"],
                    "end_location": route["end_location"]["name"],
                    "departure_time": route["departure_time"],
                    "arrival_time": route["arrival_time"],
                },
            }
            result.append(ticket_dict)

    return result


@router.get("/me/reviews", response_model=List[dict])
async def get_current_user_reviews(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get reviews written by the current user.
    """
    # Get reviews for current user
    cursor = reviews_collection.find({"user_id": current_user.id}).sort(
        "created_at", -1
    )
    reviews = await cursor.to_list(length=100)

    # Enhance reviews with route details
    result = []
    for review in reviews:
        # Get route details
        route = await routes_collection.find_one({"_id": review["route_id"]})
        if route:
            # Clean up the result for API response
            review_dict = {
                "id": str(review["_id"]),
                "rating": review["rating"],
                "comment": review["comment"],
                "created_at": review["created_at"],
                "route": {
                    "id": str(route["_id"]),
                    "start_location": route["start_location"]["name"],
                    "end_location": route["end_location"]["name"],
                },
            }
            result.append(review_dict)

    return result


@router.get("/me/operator", response_model=dict)
async def get_current_user_operator_profile(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get operator profile for current user if role is 'operator'.
    """
    if current_user.role != "operator":
        raise AuthorizationError("Only operators can access this endpoint")

    # Get operator profile
    operator = await operators_collection.find_one({"user_id": current_user.id})
    if not operator:
        raise ResourceNotFoundError("Operator profile not found")

    # Get bus count for this operator
    bus_count = await buses_collection.count_documents({"operator_id": operator["_id"]})

    # Get route count for this operator's buses
    buses_cursor = buses_collection.find({"operator_id": operator["_id"]})
    bus_ids = [bus["_id"] for bus in await buses_cursor.to_list(length=100)]
    route_count = await routes_collection.count_documents({"bus_id": {"$in": bus_ids}})

    # Format the result
    result = {
        "operator_id": str(operator["_id"]),
        "company_name": operator["company_name"],
        "contact_phone": operator["contact_phone"],
        "license_number": operator["license_number"],
        "status": operator["status"],
        "created_at": operator["created_at"],
        "statistics": {"buses": bus_count, "routes": route_count},
    }

    # Add address if exists
    if "address" in operator:
        result["address"] = operator["address"]

    return result


@router.post("/request-operator-role", response_model=dict)
async def request_operator_role(
    company_info: dict = Body(...), current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Request to become an operator.
    """
    # Check if user already has operator role
    if current_user.role == "operator":
        raise ResourceAlreadyExistsError("You already have operator role")

    # Check if operator profile already exists
    existing_operator = await operators_collection.find_one(
        {"user_id": current_user.id}
    )
    if existing_operator:
        raise ResourceAlreadyExistsError("Operator profile already exists")

    # Validate required fields
    if not company_info.get("company_name"):
        raise ValidationError("Company name is required")

    if not company_info.get("contact_phone"):
        raise ValidationError("Contact phone is required")

    if not company_info.get("license_number"):
        raise ValidationError("License number is required")

    # Check if license number is already used
    existing_license = await operators_collection.find_one(
        {"license_number": company_info["license_number"]}
    )
    if existing_license:
        raise ResourceAlreadyExistsError("License number already registered")

    # Create operator profile
    operator_dict = {
        "user_id": current_user.id,
        "company_name": company_info["company_name"],
        "contact_phone": company_info["contact_phone"],
        "license_number": company_info["license_number"],
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    # Add address if provided
    if "address" in company_info:
        operator_dict["address"] = company_info["address"]

    # Insert operator profile
    result = await operators_collection.insert_one(operator_dict)

    # Update user role to operator
    await users_collection.update_one(
        {"_id": current_user.id},
        {"$set": {"role": "operator", "updated_at": datetime.utcnow()}},
    )

    return {
        "message": "Operator request submitted successfully. Awaiting approval.",
        "operator_id": str(result.inserted_id),
    }


@router.get("/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str = Path(...), current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get a specific user by ID.
    Normal users can only see their own profile, operators can see their customers,
    admins can see all users.
    """
    # Check permissions
    if current_user.role == "user" and str(current_user.id) != user_id:
        raise AuthorizationError("You can only view your own profile")

    # Get the user
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ResourceNotFoundError("User")

    # If operator, check if this user is their customer
    if current_user.role == "operator" and str(current_user.id) != user_id:
        # Get operator profile
        operator = await operators_collection.find_one({"user_id": current_user.id})
        if not operator:
            raise ResourceNotFoundError("Operator profile")

        # Check if user has booked tickets with this operator
        buses_cursor = buses_collection.find({"operator_id": operator["_id"]})
        bus_ids = [bus["_id"] for bus in await buses_cursor.to_list(length=100)]

        if not bus_ids:
            raise AuthorizationError("You don't have access to this user")

        routes_cursor = routes_collection.find({"bus_id": {"$in": bus_ids}})
        route_ids = [route["_id"] for route in await routes_cursor.to_list(length=100)]

        if not route_ids:
            raise AuthorizationError("You don't have access to this user")

        # Check if user has tickets for these routes
        customer_check = await tickets_collection.count_documents(
            {"user_id": ObjectId(user_id), "route_id": {"$in": route_ids}}
        )

        if customer_check == 0:
            raise AuthorizationError("You don't have access to this user")

    return User(**user)
