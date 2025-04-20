from datetime import datetime, date, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from bson import ObjectId

from app.models.route import (
    Route,
    RouteCreate,
    RouteUpdate,
    RouteResponse,
    RouteListResponse,
    RouteWithDetails,
)
from app.core.errors import (
    ResourceNotFoundError,
    ResourceAlreadyExistsError,
    AuthorizationError,
    BusinessLogicError,
)
from app.core.database import (
    routes_collection,
    buses_collection,
    operators_collection,
    tickets_collection,
    users_collection,
)
from app.api import deps

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    route_in: RouteCreate,
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Create a new route.
    """
    # Check if bus exists
    bus = await buses_collection.find_one({"_id": ObjectId(route_in.bus_id)})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # If user is an operator, ensure they own this bus
    if not current_user.get("is_admin", False):
        if bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError("You can only create routes for your own buses")

    # Create route object
    route_dict = route_in.dict()
    route_dict["bus_id"] = ObjectId(route_in.bus_id)
    route_dict["created_at"] = datetime.utcnow()
    route_dict["updated_at"] = route_dict["created_at"]
    route_dict["status"] = "active"

    # Insert route into database
    result = await routes_collection.insert_one(route_dict)

    # Get the created route
    created_route = await routes_collection.find_one({"_id": result.inserted_id})

    return {"route": Route(**created_route)}


@router.get("", response_model=RouteListResponse)
async def list_routes(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    bus_id: Optional[str] = Query(None),
    operator_id: Optional[str] = Query(None),
    start_location: Optional[str] = Query(None),
    end_location: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    List routes with filtering and pagination.
    """
    # Build query
    query = {}

    # Filter by status
    if status:
        query["status"] = status
    # Public users only see active routes
    elif not current_user or current_user.get("role") == "user":
        query["status"] = "active"

    # Filter by bus
    if bus_id:
        query["bus_id"] = ObjectId(bus_id)

    # Filter by operator
    if operator_id:
        # Get all buses for this operator
        buses_cursor = buses_collection.find({"operator_id": ObjectId(operator_id)})
        bus_ids = [bus["_id"] for bus in await buses_cursor.to_list(length=1000)]
        if bus_ids:
            query["bus_id"] = {"$in": bus_ids}
        else:
            # No buses found for operator, return empty result
            return {
                "routes": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
            }

    # Filter by location
    if start_location:
        query["start_location.name"] = {"$regex": start_location, "$options": "i"}
    if end_location:
        query["end_location.name"] = {"$regex": end_location, "$options": "i"}

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await routes_collection.count_documents(query)

    # Get routes with pagination
    cursor = (
        routes_collection.find(query).skip(skip).limit(page_size).sort("created_at", -1)
    )
    routes = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "routes": [Route(**route) for route in routes],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/popular", response_model=List[Route])
async def get_popular_routes() -> Any:
    """
    Get popular routes.
    """
    # Get routes marked as popular
    query = {"status": "active", "is_popular": True}

    # If no popular routes are explicitly marked, get the most recent ones
    count = await routes_collection.count_documents(query)
    if count == 0:
        query = {"status": "active"}

    # Get routes
    routes_cursor = routes_collection.find(query).limit(10)
    routes = await routes_cursor.to_list(length=10)

    return [Route(**route) for route in routes]


@router.get("/search", response_model=List[RouteWithDetails])
async def search_routes(
    start_location: str = Query(..., min_length=2),
    end_location: str = Query(..., min_length=2),
    travel_date: date = Query(...),
    passengers: int = Query(1, ge=1, le=50),
) -> Any:
    """
    Search for available routes by start and end locations.
    """
    # Build query
    query = {
        "status": "active",
        "start_location.name": {"$regex": start_location, "$options": "i"},
        "end_location.name": {"$regex": end_location, "$options": "i"},
    }

    # Get day of the week
    day_of_week = travel_date.strftime("%A")
    query["schedule_days"] = day_of_week

    # Get routes
    routes_cursor = routes_collection.find(query)
    routes = await routes_cursor.to_list(length=100)

    # Prepare result with additional information
    result = []
    for route in routes:
        # Get bus details
        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus:
            continue

        # Get operator details
        operator = await operators_collection.find_one({"_id": bus["operator_id"]})
        if not operator:
            continue

        # Get user details for operator
        operator_user = await users_collection.find_one({"_id": operator["user_id"]})
        if not operator_user:
            continue

        # Calculate available seats
        tickets_count = await tickets_collection.count_documents(
            {
                "route_id": route["_id"],
                "travel_date": travel_date.isoformat(),
                "status": "booked",
            }
        )
        available_seats = bus["capacity"] - tickets_count

        # Skip if not enough seats
        if available_seats < passengers:
            continue

        # Add details to route
        route_with_details = RouteWithDetails(
            **route,
            bus_details={
                "id": str(bus["_id"]),
                "plate_number": bus["plate_number"],
                "model": bus["model"],
                "capacity": bus["capacity"],
                "features": bus.get("features", []),
            },
            operator_details={
                "id": str(operator["_id"]),
                "company_name": operator["company_name"],
                "user_name": operator_user["name"],
            },
            available_seats=available_seats
        )

        result.append(route_with_details)

    return result


@router.get("/{route_id}", response_model=RouteResponse)
async def get_route(
    route_id: str = Path(...),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Get a specific route by ID.
    """
    route = await routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise ResourceNotFoundError("Route")

    # Public users only see active routes
    if (not current_user or current_user.get("role") == "user") and route[
        "status"
    ] != "active":
        raise ResourceNotFoundError("Route")

    # If user is an operator, check if they own this route
    if current_user and current_user.get("role") == "operator":
        # Get operator profile
        operator = await operators_collection.find_one({"user_id": current_user["_id"]})
        if operator:
            # Get bus
            bus = await buses_collection.find_one({"_id": route["bus_id"]})
            if bus and bus["operator_id"] != operator["_id"]:
                raise AuthorizationError("You can only access your own routes")

    return {"route": Route(**route)}


@router.put("/{route_id}", response_model=RouteResponse)
async def update_route(
    route_update: RouteUpdate,
    route_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Update a route.
    """
    # Get the route
    route = await routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise ResourceNotFoundError("Route")

    # If user is an operator, ensure they own this route
    if not current_user.get("is_admin", False):
        # Get bus
        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus or bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError("You can only update routes for your own buses")

    # If changing bus_id, check bus exists and operator has access
    if route_update.bus_id:
        new_bus = await buses_collection.find_one(
            {"_id": ObjectId(route_update.bus_id)}
        )
        if not new_bus:
            raise ResourceNotFoundError("Bus")

        if not current_user.get("is_admin", False):
            if new_bus["operator_id"] != current_user["operator"]["_id"]:
                raise AuthorizationError("You can only assign routes to your own buses")

    # Build update dictionary with only provided fields
    update_dict = {}
    for field, value in route_update.dict(exclude_unset=True).items():
        if value is not None:
            if field == "bus_id":
                update_dict[field] = ObjectId(value)
            elif field in ["start_location", "end_location"]:
                # Handle nested location objects
                if isinstance(value, dict):
                    # Validate GeoJSON coordinates if provided
                    if "coordinates" in value and isinstance(
                        value["coordinates"], dict
                    ):
                        if "coordinates" in value["coordinates"]:
                            if len(value["coordinates"]["coordinates"]) != 2:
                                raise ValueError(
                                    "Coordinates must be [longitude, latitude]"
                                )
                    update_dict[field] = value
            elif field == "stops":
                # Handle stops array
                for stop in value:
                    if "coordinates" in stop and isinstance(stop["coordinates"], dict):
                        if "coordinates" in stop["coordinates"]:
                            if len(stop["coordinates"]["coordinates"]) != 2:
                                raise ValueError(
                                    "Coordinates must be [longitude, latitude]"
                                )
                update_dict[field] = value
            else:
                update_dict[field] = value

    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()

        # Update route
        await routes_collection.update_one(
            {"_id": ObjectId(route_id)}, {"$set": update_dict}
        )

    # Get updated route
    updated_route = await routes_collection.find_one({"_id": ObjectId(route_id)})

    return {"route": Route(**updated_route)}


@router.delete("/{route_id}")
async def delete_route(
    route_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Delete a route.
    """
    # Get the route
    route = await routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise ResourceNotFoundError("Route")

    # If user is an operator, ensure they own this route
    if not current_user.get("is_admin", False):
        # Get bus
        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus or bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError("You can only delete routes for your own buses")

    # Check if the route has associated tickets
    tickets_count = await tickets_collection.count_documents(
        {
            "route_id": ObjectId(route_id),
            "status": "booked",
            "travel_date": {"$gte": datetime.now().strftime("%Y-%m-%d")},
        }
    )

    if tickets_count > 0:
        # Instead of deleting, mark as inactive
        await routes_collection.update_one(
            {"_id": ObjectId(route_id)},
            {"$set": {"status": "inactive", "updated_at": datetime.utcnow()}},
        )
    else:
        # No future tickets, safe to delete
        await routes_collection.delete_one({"_id": ObjectId(route_id)})

    return {"message": "Route deleted successfully"}


@router.get("/{route_id}/availability", response_model=dict)
async def get_route_availability(
    route_id: str = Path(...),
    date_from: date = Query(...),
    date_to: date = Query(...),
) -> Any:
    """
    Get seat availability for a route between specified dates.
    """
    # Verify route exists and is active
    route = await routes_collection.find_one(
        {"_id": ObjectId(route_id), "status": "active"}
    )
    if not route:
        raise ResourceNotFoundError("Route")

    # Get bus details to know capacity
    bus = await buses_collection.find_one({"_id": route["bus_id"]})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # Calculate date range
    if (date_to - date_from).days > 30:
        raise BusinessLogicError("Date range cannot exceed 30 days")

    # Get all dates in range
    date_range = [
        (date_from + timedelta(days=i)).isoformat()
        for i in range((date_to - date_from).days + 1)
    ]

    # Get day of week for each date
    days_of_week = [
        (date_from + timedelta(days=i)).strftime("%A")
        for i in range((date_to - date_from).days + 1)
    ]

    # Filter out dates where route doesn't operate
    valid_dates = [
        date_range[i]
        for i in range(len(date_range))
        if days_of_week[i] in route["schedule_days"]
    ]

    # Get bookings for these dates
    pipeline = [
        {
            "$match": {
                "route_id": ObjectId(route_id),
                "travel_date": {"$in": valid_dates},
                "status": "booked",
            }
        },
        {"$group": {"_id": "$travel_date", "booked_seats": {"$sum": 1}}},
    ]

    bookings = await tickets_collection.aggregate(pipeline).to_list(length=100)

    # Build availability dictionary
    availability = {}
    for date_str in valid_dates:
        # Find booking for this date
        booking = next((b for b in bookings if b["_id"] == date_str), None)
        booked_seats = booking["booked_seats"] if booking else 0

        availability[date_str] = {
            "total_seats": bus["capacity"],
            "booked_seats": booked_seats,
            "available_seats": bus["capacity"] - booked_seats,
        }

    return {
        "route_id": route_id,
        "bus_id": str(bus["_id"]),
        "bus_capacity": bus["capacity"],
        "availability": availability,
    }
