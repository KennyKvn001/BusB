from datetime import datetime, timedelta
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from bson import ObjectId

from app.models.user import User, UserUpdate
from app.models.operator import Operator, OperatorUpdate
from app.core.errors import (
    ResourceNotFoundError,
    AuthorizationError,
    BusinessLogicError,
)
from app.core.database import (
    users_collection,
    operators_collection,
    buses_collection,
    routes_collection,
    tickets_collection,
    reviews_collection,
)
from app.api import deps

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[User])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    List all users with filtering.
    """
    # Build query
    query = {}

    # Filter by role
    if role:
        query["role"] = role

    # Filter by status
    if status:
        query["status"] = status

    # Search by name or email
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    # Get users with pagination
    cursor = users_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)

    return [User(**user) for user in users]


@router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: str = Path(...), current_admin: dict = Depends(deps.get_current_admin)
) -> Any:
    """
    Get a specific user by ID.
    """
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ResourceNotFoundError("User")

    return User(**user)


@router.put("/users/{user_id}/update-role", response_model=User)
async def update_user_role(
    user_id: str = Path(...),
    role: str = Query(...),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    Update a user's role.
    """
    # Check if role is valid
    if role not in ["user", "operator", "admin"]:
        raise BusinessLogicError("Invalid role. Must be one of: user, operator, admin")

    # Get the user
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ResourceNotFoundError("User")

    # Update user role
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role, "updated_at": datetime.utcnow()}},
    )

    # If changing to operator role, create operator profile if it doesn't exist
    if role == "operator" and not await operators_collection.find_one(
        {"user_id": ObjectId(user_id)}
    ):
        operator_dict = {
            "user_id": ObjectId(user_id),
            "company_name": f"{user['name']}'s Bus Company",
            "contact_phone": "",
            "license_number": "",
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await operators_collection.insert_one(operator_dict)

    # Get updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})

    return User(**updated_user)


@router.put("/users/{user_id}/update-status", response_model=User)
async def update_user_status(
    user_id: str = Path(...),
    status: str = Query(...),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    Update a user's status.
    """
    # Check if status is valid
    if status not in ["active", "inactive", "suspended"]:
        raise BusinessLogicError(
            "Invalid status. Must be one of: active, inactive, suspended"
        )

    # Get the user
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ResourceNotFoundError("User")

    # Prevent admin from suspending themselves
    if user_id == str(current_admin["_id"]) and status != "active":
        raise BusinessLogicError("Cannot change your own status")

    # Update user status
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )

    # Get updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})

    return User(**updated_user)


@router.get("/operators", response_model=List[Dict])
async def list_all_operators(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    List all operators with filtering.
    """
    # Build query
    query = {}

    # Filter by status
    if status:
        query["status"] = status

    # Search by company name or license number
    if search:
        query["$or"] = [
            {"company_name": {"$regex": search, "$options": "i"}},
            {"license_number": {"$regex": search, "$options": "i"}},
        ]

    # Get operators with pagination
    cursor = (
        operators_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    )
    operators = await cursor.to_list(length=limit)

    # Get user details for each operator
    result = []
    for operator in operators:
        user = await users_collection.find_one({"_id": operator["user_id"]})
        if user:
            result.append(
                {
                    "operator": Operator(**operator),
                    "user": {
                        "id": str(user["_id"]),
                        "name": user["name"],
                        "email": user["email"],
                        "role": user["role"],
                        "status": user["status"],
                    },
                }
            )

    return result


@router.put("/operators/{operator_id}/approve", response_model=Dict)
async def approve_operator(
    operator_id: str = Path(...), current_admin: dict = Depends(deps.get_current_admin)
) -> Any:
    """
    Approve an operator.
    """
    # Get the operator
    operator = await operators_collection.find_one({"_id": ObjectId(operator_id)})
    if not operator:
        raise ResourceNotFoundError("Operator")

    # Check if operator is already approved
    if operator["status"] == "approved":
        return {
            "message": "Operator is already approved",
            "operator": Operator(**operator),
        }

    # Update operator status
    await operators_collection.update_one(
        {"_id": ObjectId(operator_id)},
        {"$set": {"status": "approved", "updated_at": datetime.utcnow()}},
    )

    # Get updated operator
    updated_operator = await operators_collection.find_one(
        {"_id": ObjectId(operator_id)}
    )

    return {
        "message": "Operator approved successfully",
        "operator": Operator(**updated_operator),
    }


@router.put("/operators/{operator_id}/suspend", response_model=Dict)
async def suspend_operator(
    operator_id: str = Path(...), current_admin: dict = Depends(deps.get_current_admin)
) -> Any:
    """
    Suspend an operator.
    """
    # Get the operator
    operator = await operators_collection.find_one({"_id": ObjectId(operator_id)})
    if not operator:
        raise ResourceNotFoundError("Operator")

    # Check if operator is already suspended
    if operator["status"] == "suspended":
        return {
            "message": "Operator is already suspended",
            "operator": Operator(**operator),
        }

    # Update operator status
    await operators_collection.update_one(
        {"_id": ObjectId(operator_id)},
        {"$set": {"status": "suspended", "updated_at": datetime.utcnow()}},
    )

    # Get updated operator
    updated_operator = await operators_collection.find_one(
        {"_id": ObjectId(operator_id)}
    )

    return {
        "message": "Operator suspended successfully",
        "operator": Operator(**updated_operator),
    }


@router.get("/statistics/overview", response_model=Dict)
async def get_system_statistics(
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    Get system-wide statistics.
    """
    # Count total users by role
    users_stats = await users_collection.aggregate(
        [{"$group": {"_id": "$role", "count": {"$sum": 1}}}]
    ).to_list(length=10)

    # Convert to dictionary
    users_by_role = {stat["_id"]: stat["count"] for stat in users_stats}

    # Count operators by status
    operators_stats = await operators_collection.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    ).to_list(length=10)

    # Convert to dictionary
    operators_by_status = {stat["_id"]: stat["count"] for stat in operators_stats}

    # Count buses
    buses_count = await buses_collection.count_documents({})

    # Count routes
    routes_count = await routes_collection.count_documents({})

    # Count tickets by status
    tickets_stats = await tickets_collection.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    ).to_list(length=10)

    # Convert to dictionary
    tickets_by_status = {stat["_id"]: stat["count"] for stat in tickets_stats}

    # Calculate total revenue (from paid tickets)
    revenue_pipeline = [
        {"$match": {"payment.status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}},
    ]
    revenue_result = await tickets_collection.aggregate(revenue_pipeline).to_list(
        length=1
    )
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    # Get recent activity
    recent_tickets = (
        await tickets_collection.find()
        .sort("created_at", -1)
        .limit(10)
        .to_list(length=10)
    )
    recent_users = (
        await users_collection.find()
        .sort("created_at", -1)
        .limit(10)
        .to_list(length=10)
    )

    return {
        "users": {"total": sum(users_by_role.values()), "by_role": users_by_role},
        "operators": {
            "total": sum(operators_by_status.values()),
            "by_status": operators_by_status,
        },
        "buses": {"total": buses_count},
        "routes": {"total": routes_count},
        "tickets": {
            "total": sum(tickets_by_status.values()),
            "by_status": tickets_by_status,
        },
        "revenue": {"total": total_revenue},
        "recent_activity": {
            "tickets": [
                {
                    "id": str(ticket["_id"]),
                    "reference": ticket["booking_reference"],
                    "date": ticket["created_at"],
                }
                for ticket in recent_tickets
            ],
            "users": [
                {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"],
                    "date": user["created_at"],
                }
                for user in recent_users
            ],
        },
    }


@router.get("/statistics/revenue", response_model=Dict)
async def get_revenue_statistics(
    days: int = Query(30, ge=1, le=365),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    Get revenue statistics for a specific time period.
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Revenue by date
    daily_revenue_pipeline = [
        {
            "$match": {
                "payment.status": "paid",
                "created_at": {"$gte": start_date, "$lte": end_date},
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "revenue": {"$sum": "$price"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    daily_revenue = await tickets_collection.aggregate(daily_revenue_pipeline).to_list(
        length=365
    )

    # Revenue by operator
    operator_revenue_pipeline = [
        {
            "$match": {
                "payment.status": "paid",
                "created_at": {"$gte": start_date, "$lte": end_date},
            }
        },
        {
            "$lookup": {
                "from": "routes",
                "localField": "route_id",
                "foreignField": "_id",
                "as": "route",
            }
        },
        {"$unwind": "$route"},
        {
            "$lookup": {
                "from": "buses",
                "localField": "route.bus_id",
                "foreignField": "_id",
                "as": "bus",
            }
        },
        {"$unwind": "$bus"},
        {
            "$lookup": {
                "from": "operators",
                "localField": "bus.operator_id",
                "foreignField": "_id",
                "as": "operator",
            }
        },
        {"$unwind": "$operator"},
        {
            "$lookup": {
                "from": "users",
                "localField": "operator.user_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": "$user"},
        {
            "$group": {
                "_id": "$operator._id",
                "operator_name": {"$first": "$operator.company_name"},
                "user_name": {"$first": "$user.name"},
                "revenue": {"$sum": "$price"},
                "tickets": {"$sum": 1},
            }
        },
        {"$sort": {"revenue": -1}},
    ]

    operator_revenue = await tickets_collection.aggregate(
        operator_revenue_pipeline
    ).to_list(length=100)

    # Format operator revenue
    formatted_operator_revenue = []
    for item in operator_revenue:
        formatted_operator_revenue.append(
            {
                "operator_id": str(item["_id"]),
                "operator_name": item["operator_name"],
                "user_name": item["user_name"],
                "revenue": item["revenue"],
                "tickets": item["tickets"],
            }
        )

    # Revenue by route
    route_revenue_pipeline = [
        {
            "$match": {
                "payment.status": "paid",
                "created_at": {"$gte": start_date, "$lte": end_date},
            }
        },
        {
            "$lookup": {
                "from": "routes",
                "localField": "route_id",
                "foreignField": "_id",
                "as": "route",
            }
        },
        {"$unwind": "$route"},
        {
            "$group": {
                "_id": "$route._id",
                "start": {"$first": "$route.start_location.name"},
                "end": {"$first": "$route.end_location.name"},
                "revenue": {"$sum": "$price"},
                "tickets": {"$sum": 1},
            }
        },
        {"$sort": {"revenue": -1}},
    ]

    route_revenue = await tickets_collection.aggregate(route_revenue_pipeline).to_list(
        length=100
    )

    # Format route revenue
    formatted_route_revenue = []
    for item in route_revenue:
        formatted_route_revenue.append(
            {
                "route_id": str(item["_id"]),
                "route_name": f"{item['start']} to {item['end']}",
                "revenue": item["revenue"],
                "tickets": item["tickets"],
            }
        )

    return {
        "time_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days,
        },
        "total_revenue": sum(item["revenue"] for item in daily_revenue),
        "total_tickets": sum(item["count"] for item in daily_revenue),
        "daily_revenue": daily_revenue,
        "revenue_by_operator": formatted_operator_revenue,
        "revenue_by_route": formatted_route_revenue,
    }


@router.get("/statistics/bookings", response_model=Dict)
async def get_booking_statistics(
    days: int = Query(30, ge=1, le=365),
    current_admin: dict = Depends(deps.get_current_admin),
) -> Any:
    """
    Get booking statistics for a specific time period.
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Bookings by date
    daily_bookings_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    daily_bookings = await tickets_collection.aggregate(
        daily_bookings_pipeline
    ).to_list(length=365)

    # Bookings by status
    status_bookings_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]

    status_bookings = await tickets_collection.aggregate(
        status_bookings_pipeline
    ).to_list(length=10)

    # Bookings by payment status
    payment_bookings_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$payment.status", "count": {"$sum": 1}}},
    ]

    payment_bookings = await tickets_collection.aggregate(
        payment_bookings_pipeline
    ).to_list(length=10)

    # Popular routes (most booked)
    popular_routes_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {
            "$lookup": {
                "from": "routes",
                "localField": "route_id",
                "foreignField": "_id",
                "as": "route",
            }
        },
        {"$unwind": "$route"},
        {
            "$group": {
                "_id": "$route._id",
                "start": {"$first": "$route.start_location.name"},
                "end": {"$first": "$route.end_location.name"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]

    popular_routes = await tickets_collection.aggregate(
        popular_routes_pipeline
    ).to_list(length=10)

    # Format popular routes
    formatted_popular_routes = []
    for item in popular_routes:
        formatted_popular_routes.append(
            {
                "route_id": str(item["_id"]),
                "route_name": f"{item['start']} to {item['end']}",
                "bookings": item["count"],
            }
        )

    return {
        "time_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days,
        },
        "total_bookings": sum(item["count"] for item in daily_bookings),
        "daily_bookings": daily_bookings,
        "bookings_by_status": {item["_id"]: item["count"] for item in status_bookings},
        "bookings_by_payment": {
            item["_id"]: item["count"] for item in payment_bookings
        },
        "popular_routes": formatted_popular_routes,
    }
