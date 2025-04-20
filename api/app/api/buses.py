from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from bson import ObjectId

from app.models.bus import Bus, BusCreate, BusUpdate, BusResponse, BusListResponse
from app.core.errors import (
    ResourceNotFoundError,
    ResourceAlreadyExistsError,
    AuthorizationError,
)
from app.core.database import buses_collection, routes_collection, operators_collection
from app.api import deps

router = APIRouter(prefix="/buses", tags=["Buses"])


@router.post("", response_model=BusResponse, status_code=status.HTTP_201_CREATED)
async def create_bus(
    bus_in: BusCreate, current_operator: dict = Depends(deps.get_current_operator)
) -> Any:
    """
    Create a new bus.
    """
    # Check if bus with this plate number already exists
    existing_bus = await buses_collection.find_one(
        {"plate_number": bus_in.plate_number}
    )
    if existing_bus:
        raise ResourceAlreadyExistsError("Bus with this plate number")

    # Create bus object
    bus_dict = bus_in.dict(exclude={"operator_id"})
    bus_dict["operator_id"] = current_operator["operator"]["_id"]
    bus_dict["created_at"] = datetime.utcnow()
    bus_dict["updated_at"] = bus_dict["created_at"]
    bus_dict["status"] = "active"
    bus_dict["images"] = []

    # Insert bus into database
    result = await buses_collection.insert_one(bus_dict)

    # Get the created bus
    created_bus = await buses_collection.find_one({"_id": result.inserted_id})

    return {"bus": Bus(**created_bus)}


@router.get("", response_model=BusListResponse)
async def list_buses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    operator_id: Optional[str] = Query(None),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    List buses with pagination.
    """
    # Build query
    query = {}

    # Filter by status if provided
    if status:
        query["status"] = status

    # If user is an operator, only return their buses
    if not current_user.get("is_admin", False):
        query["operator_id"] = current_user["operator"]["_id"]
    # If admin specifies operator_id, filter by it
    elif operator_id:
        query["operator_id"] = ObjectId(operator_id)

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await buses_collection.count_documents(query)

    # Get buses with pagination
    cursor = (
        buses_collection.find(query).skip(skip).limit(page_size).sort("created_at", -1)
    )
    buses = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "buses": [Bus(**bus) for bus in buses],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/public", response_model=BusListResponse)
async def list_public_buses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    operator_id: Optional[str] = Query(None),
) -> Any:
    """
    List active buses for public viewing.
    """
    # Build query
    query = {"status": "active"}

    # Filter by operator if provided
    if operator_id:
        query["operator_id"] = ObjectId(operator_id)

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await buses_collection.count_documents(query)

    # Get buses with pagination
    cursor = buses_collection.find(query).skip(skip).limit(page_size)
    buses = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "buses": [Bus(**bus) for bus in buses],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{bus_id}", response_model=BusResponse)
async def get_bus(
    bus_id: str = Path(...),
    current_user_or_public: Optional[dict] = Depends(
        deps.get_current_operator_or_admin
    ),
) -> Any:
    """
    Get a specific bus by ID.
    """
    bus = await buses_collection.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # If user is an operator, ensure they own this bus
    if current_user_or_public and not current_user_or_public.get("is_admin", False):
        if bus["operator_id"] != current_user_or_public["operator"]["_id"]:
            raise AuthorizationError("You can only access your own buses")

    return {"bus": Bus(**bus)}


@router.put("/{bus_id}", response_model=BusResponse)
async def update_bus(
    bus_update: BusUpdate,
    bus_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Update a bus.
    """
    # Get the bus
    bus = await buses_collection.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # If user is an operator, ensure they own this bus
    if not current_user.get("is_admin", False):
        if bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError("You can only update your own buses")

    # Check if plate number is being changed and if it already exists
    if bus_update.plate_number and bus_update.plate_number != bus["plate_number"]:
        existing_bus = await buses_collection.find_one(
            {"plate_number": bus_update.plate_number}
        )
        if existing_bus:
            raise ResourceAlreadyExistsError("Bus with this plate number")

    # Build update dictionary with only provided fields
    update_dict = {
        k: v for k, v in bus_update.dict(exclude_unset=True).items() if v is not None
    }
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()

        # Update bus
        await buses_collection.update_one(
            {"_id": ObjectId(bus_id)}, {"$set": update_dict}
        )

    # Get updated bus
    updated_bus = await buses_collection.find_one({"_id": ObjectId(bus_id)})

    return {"bus": Bus(**updated_bus)}


@router.delete("/{bus_id}")
async def delete_bus(
    bus_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Delete a bus.
    """
    # Get the bus
    bus = await buses_collection.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # If user is an operator, ensure they own this bus
    if not current_user.get("is_admin", False):
        if bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError("You can only delete your own buses")

    # Check if the bus has associated routes
    routes_count = await routes_collection.count_documents({"bus_id": ObjectId(bus_id)})
    if routes_count > 0:
        # Instead of deleting, mark as inactive
        await buses_collection.update_one(
            {"_id": ObjectId(bus_id)},
            {"$set": {"status": "inactive", "updated_at": datetime.utcnow()}},
        )
    else:
        # No routes, safe to delete
        await buses_collection.delete_one({"_id": ObjectId(bus_id)})

    return {"message": "Bus deleted successfully"}


@router.get("/{bus_id}/routes", response_model=List[dict])
async def get_bus_routes(
    bus_id: str = Path(...),
    current_user_or_public: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Get all routes for a specific bus.
    """
    # Verify bus exists
    bus = await buses_collection.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # If user is an operator and not an admin, ensure they own this bus
    if current_user_or_public and current_user_or_public.get("role") == "operator":
        operator = await operators_collection.find_one(
            {"user_id": current_user_or_public["_id"]}
        )
        if operator and bus["operator_id"] != operator["_id"]:
            raise AuthorizationError("You can only access routes for your own buses")

    # Get routes for this bus
    query = {"bus_id": ObjectId(bus_id)}

    # Public users only see active routes
    if not current_user_or_public or current_user_or_public.get("role") == "user":
        query["status"] = "active"

    cursor = routes_collection.find(query)
    routes = await cursor.to_list(length=100)  # Limit to 100 routes

    # Convert ObjectId to string for JSON response
    for route in routes:
        route["_id"] = str(route["_id"])
        route["bus_id"] = str(route["bus_id"])

    return routes
