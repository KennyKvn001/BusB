from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from bson import ObjectId

from app.models.review import (
    Review,
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewListResponse,
    ReviewWithDetails,
)
from app.core.errors import (
    ResourceNotFoundError,
    ResourceAlreadyExistsError,
    AuthorizationError,
    BusinessLogicError,
)
from app.core.database import (
    reviews_collection,
    tickets_collection,
    routes_collection,
    buses_collection,
    operators_collection,
    users_collection,
)
from app.api import deps

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate, current_user: dict = Depends(deps.get_current_user)
) -> Any:
    """
    Create a new review. A user can only review tickets they have purchased and completed.
    """
    # Verify ticket exists and is completed
    ticket = await tickets_collection.find_one(
        {"_id": ObjectId(review_in.ticket_id), "status": "completed"}
    )
    if not ticket:
        raise ResourceNotFoundError("Completed ticket")

    # Check if user owns this ticket
    if not ticket.get("user_id") or ticket["user_id"] != current_user["_id"]:
        raise AuthorizationError("You can only review your own tickets")

    # Check if a review already exists for this ticket
    existing_review = await reviews_collection.find_one(
        {"ticket_id": ObjectId(review_in.ticket_id)}
    )
    if existing_review:
        raise ResourceAlreadyExistsError("Review for this ticket")

    # Get route, bus, and operator IDs
    route = await routes_collection.find_one({"_id": ticket["route_id"]})
    if not route:
        raise ResourceNotFoundError("Route")

    bus = await buses_collection.find_one({"_id": route["bus_id"]})
    if not bus:
        raise ResourceNotFoundError("Bus")

    operator = await operators_collection.find_one({"_id": bus["operator_id"]})
    if not operator:
        raise ResourceNotFoundError("Operator")

    # Create review object
    review_dict = review_in.dict()
    review_dict["user_id"] = current_user["_id"]
    review_dict["route_id"] = route["_id"]
    review_dict["bus_id"] = bus["_id"]
    review_dict["operator_id"] = operator["_id"]
    review_dict["ticket_id"] = ObjectId(review_in.ticket_id)
    review_dict["created_at"] = datetime.utcnow()
    review_dict["updated_at"] = review_dict["created_at"]

    # Insert review into database
    result = await reviews_collection.insert_one(review_dict)

    # Get the created review
    created_review = await reviews_collection.find_one({"_id": result.inserted_id})

    return {"review": Review(**created_review)}


@router.get("", response_model=ReviewListResponse)
async def list_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    route_id: Optional[str] = Query(None),
    bus_id: Optional[str] = Query(None),
    operator_id: Optional[str] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    List reviews with filtering and pagination.
    """
    # Build query
    query = {}

    # Filter by route
    if route_id:
        query["route_id"] = ObjectId(route_id)

    # Filter by bus
    if bus_id:
        query["bus_id"] = ObjectId(bus_id)

    # Filter by operator
    if operator_id:
        query["operator_id"] = ObjectId(operator_id)

    # Filter by rating
    if rating:
        query["rating"] = rating

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await reviews_collection.count_documents(query)

    # Get reviews with pagination
    cursor = (
        reviews_collection.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("created_at", -1)
    )
    reviews = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "reviews": [Review(**review) for review in reviews],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/my-reviews", response_model=ReviewListResponse)
async def get_my_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(deps.get_current_user),
) -> Any:
    """
    Get reviews written by the authenticated user.
    """
    # Build query
    query = {"user_id": current_user["_id"]}

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await reviews_collection.count_documents(query)

    # Get reviews with pagination
    cursor = (
        reviews_collection.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("created_at", -1)
    )
    reviews = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "reviews": [Review(**review) for review in reviews],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/operator-reviews", response_model=ReviewListResponse)
async def get_operator_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    rating: Optional[int] = Query(None, ge=1, le=5),
    current_user: dict = Depends(deps.get_current_operator),
) -> Any:
    """
    Get reviews for the authenticated operator.
    """
    # Build query
    query = {"operator_id": current_user["operator"]["_id"]}

    # Filter by rating
    if rating:
        query["rating"] = rating

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await reviews_collection.count_documents(query)

    # Get reviews with pagination
    cursor = (
        reviews_collection.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("created_at", -1)
    )
    reviews = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "reviews": [Review(**review) for review in reviews],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{review_id}", response_model=ReviewWithDetails)
async def get_review(
    review_id: str = Path(...),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Get a specific review by ID with detailed information.
    """
    review = await reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise ResourceNotFoundError("Review")

    # Get route details
    route = await routes_collection.find_one({"_id": review["route_id"]})
    if not route:
        route_details = {"id": str(review["route_id"]), "name": "Unknown Route"}
    else:
        route_details = {
            "id": str(route["_id"]),
            "start_location": route["start_location"]["name"],
            "end_location": route["end_location"]["name"],
        }

    # Get bus details
    bus = await buses_collection.find_one({"_id": review["bus_id"]})
    if not bus:
        bus_details = {"id": str(review["bus_id"]), "name": "Unknown Bus"}
    else:
        bus_details = {
            "id": str(bus["_id"]),
            "plate_number": bus["plate_number"],
            "model": bus["model"],
        }

    # Get operator details
    operator = await operators_collection.find_one({"_id": review["operator_id"]})
    if not operator:
        operator_details = {
            "id": str(review["operator_id"]),
            "name": "Unknown Operator",
        }
    else:
        operator_details = {
            "id": str(operator["_id"]),
            "company_name": operator["company_name"],
        }

    # Get user details (only for authenticated users)
    user = await users_collection.find_one({"_id": review["user_id"]})
    if not user:
        user_details = {"id": str(review["user_id"]), "name": "Unknown User"}
    else:
        user_details = {"id": str(user["_id"]), "name": user["name"]}

    # Create response with details
    review_with_details = ReviewWithDetails(
        **review,
        route_details=route_details,
        bus_details=bus_details,
        operator_details=operator_details,
        user_details=user_details
    )

    return review_with_details


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_update: ReviewUpdate,
    review_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_user),
) -> Any:
    """
    Update a review. Users can only update their own reviews.
    """
    # Get the review
    review = await reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise ResourceNotFoundError("Review")

    # Check if user owns this review
    if review["user_id"] != current_user["_id"]:
        raise AuthorizationError("You can only update your own reviews")

    # Build update dictionary with only provided fields
    update_dict = {
        k: v for k, v in review_update.dict(exclude_unset=True).items() if v is not None
    }

    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()

        # Update review
        await reviews_collection.update_one(
            {"_id": ObjectId(review_id)}, {"$set": update_dict}
        )

    # Get updated review
    updated_review = await reviews_collection.find_one({"_id": ObjectId(review_id)})

    return {"review": Review(**updated_review)}


@router.delete("/{review_id}")
async def delete_review(
    review_id: str = Path(...), current_user: dict = Depends(deps.get_current_user)
) -> Any:
    """
    Delete a review. Users can only delete their own reviews.
    Admins can delete any review.
    """
    # Get the review
    review = await reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise ResourceNotFoundError("Review")

    # Check if user owns this review or is admin
    if current_user["role"] != "admin" and review["user_id"] != current_user["_id"]:
        raise AuthorizationError("You can only delete your own reviews")

    # Delete review
    await reviews_collection.delete_one({"_id": ObjectId(review_id)})

    return {"message": "Review deleted successfully"}
