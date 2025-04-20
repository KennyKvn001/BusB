from datetime import datetime, date, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from bson import ObjectId
import asyncio

from app.models.ticket import (
    Ticket,
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketListResponse,
    TicketWithDetails,
    generate_booking_reference,
)
from app.core.errors import (
    ResourceNotFoundError,
    BusinessLogicError,
    AuthorizationError,
    InsufficientSeatsError,
)
from app.core.database import (
    tickets_collection,
    routes_collection,
    buses_collection,
    operators_collection,
    users_collection,
)
from app.api import deps

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: Optional[dict] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Book a ticket. Can be done by authenticated users or guests.
    """
    # Verify route exists and is active
    route = await routes_collection.find_one(
        {"_id": ObjectId(ticket_in.route_id), "status": "active"}
    )
    if not route:
        raise ResourceNotFoundError("Route")

    # Check if travel date matches the schedule
    travel_day = ticket_in.travel_date.strftime("%A")
    if travel_day not in route["schedule_days"]:
        raise BusinessLogicError(f"Route does not operate on {travel_day}")

    # Check if travel date is in the past
    if ticket_in.travel_date < datetime.now().date():
        raise BusinessLogicError("Cannot book tickets for past dates")

    # Get bus to check capacity
    bus = await buses_collection.find_one({"_id": route["bus_id"]})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # Check if seat number is valid
    if ticket_in.seat_number < 1 or ticket_in.seat_number > bus["capacity"]:
        raise BusinessLogicError(f"Seat number must be between 1 and {bus['capacity']}")

    # Check if seat is already booked
    existing_ticket = await tickets_collection.find_one(
        {
            "route_id": ObjectId(ticket_in.route_id),
            "travel_date": ticket_in.travel_date.isoformat(),
            "seat_number": ticket_in.seat_number,
            "status": "booked",
        }
    )
    if existing_ticket:
        raise BusinessLogicError(f"Seat {ticket_in.seat_number} is already booked")

    # Create ticket object
    ticket_dict = ticket_in.dict()
    ticket_dict["route_id"] = ObjectId(ticket_in.route_id)
    ticket_dict["created_at"] = datetime.utcnow()
    ticket_dict["updated_at"] = ticket_dict["created_at"]

    # Set user_id if authenticated
    if current_user:
        ticket_dict["user_id"] = current_user["_id"]
        ticket_dict.pop("guest_info", None)  # Remove guest info if authenticated
    else:
        # For guest booking, ensure guest_info is provided
        if not ticket_dict.get("guest_info"):
            raise BusinessLogicError("Guest information is required for guest bookings")

    # Generate booking reference
    booking_reference = generate_booking_reference()
    while await tickets_collection.find_one({"booking_reference": booking_reference}):
        booking_reference = generate_booking_reference()

    ticket_dict["booking_reference"] = booking_reference

    # Insert ticket into database
    result = await tickets_collection.insert_one(ticket_dict)

    # Get the created ticket
    created_ticket = await tickets_collection.find_one({"_id": result.inserted_id})

    return {"ticket": Ticket(**created_ticket)}


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    route_id: Optional[str] = Query(None),
    travel_date_from: Optional[date] = Query(None),
    travel_date_to: Optional[date] = Query(None),
    current_user: dict = Depends(deps.get_current_user),
) -> Any:
    """
    List tickets with filtering and pagination.
    """
    # Build query
    query = {}

    # User specific query
    if current_user["role"] == "user":
        # Regular users can only see their own tickets
        query["user_id"] = current_user["_id"]
    elif current_user["role"] == "operator":
        # Operators can see tickets for their routes
        operator = await operators_collection.find_one({"user_id": current_user["_id"]})
        if not operator:
            raise ResourceNotFoundError("Operator profile")

        # Get buses for this operator
        buses_cursor = buses_collection.find({"operator_id": operator["_id"]})
        bus_ids = [bus["_id"] for bus in await buses_cursor.to_list(length=1000)]

        if not bus_ids:
            # No buses, return empty result
            return {
                "tickets": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
            }

        # Get routes for these buses
        routes_cursor = routes_collection.find({"bus_id": {"$in": bus_ids}})
        route_ids = [route["_id"] for route in await routes_cursor.to_list(length=1000)]

        if not route_ids:
            # No routes, return empty result
            return {
                "tickets": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
            }

        # Filter by these routes
        query["route_id"] = {"$in": route_ids}

    # Filter by status
    if status:
        query["status"] = status

    # Filter by route
    if route_id:
        # Check if user has access to this route
        if current_user["role"] == "operator":
            route = await routes_collection.find_one({"_id": ObjectId(route_id)})
            if route:
                bus = await buses_collection.find_one({"_id": route["bus_id"]})
                if bus:
                    operator = await operators_collection.find_one(
                        {"user_id": current_user["_id"]}
                    )
                    if operator and bus["operator_id"] != operator["_id"]:
                        raise AuthorizationError(
                            "You can only access tickets for your own routes"
                        )

        query["route_id"] = ObjectId(route_id)

    # Filter by travel date
    date_filter = {}
    if travel_date_from:
        date_filter["$gte"] = travel_date_from.isoformat()
    if travel_date_to:
        date_filter["$lte"] = travel_date_to.isoformat()
    if date_filter:
        query["travel_date"] = date_filter

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await tickets_collection.count_documents(query)

    # Get tickets with pagination
    cursor = (
        tickets_collection.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("created_at", -1)
    )
    tickets = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "tickets": [Ticket(**ticket) for ticket in tickets],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/my-tickets", response_model=TicketListResponse)
async def get_my_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(deps.get_current_user),
) -> Any:
    """
    Get tickets for the authenticated user.
    """
    # Build query
    query = {"user_id": current_user["_id"]}

    # Filter by status
    if status:
        query["status"] = status

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get total count
    total = await tickets_collection.count_documents(query)

    # Get tickets with pagination
    cursor = (
        tickets_collection.find(query)
        .skip(skip)
        .limit(page_size)
        .sort("travel_date", -1)
    )
    tickets = await cursor.to_list(length=page_size)

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return {
        "tickets": [Ticket(**ticket) for ticket in tickets],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{ticket_id}", response_model=TicketWithDetails)
async def get_ticket(
    ticket_id: str = Path(...), current_user: dict = Depends(deps.get_current_user)
) -> Any:
    """
    Get a specific ticket by ID with detailed information.
    """
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise ResourceNotFoundError("Ticket")

    # Check access permissions
    if current_user["role"] == "user" and (
        not ticket.get("user_id") or ticket["user_id"] != current_user["_id"]
    ):
        raise AuthorizationError("You can only access your own tickets")
    elif current_user["role"] == "operator":
        # Check if ticket is for a route operated by this operator
        route = await routes_collection.find_one({"_id": ticket["route_id"]})
        if not route:
            raise ResourceNotFoundError("Route")

        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus:
            raise ResourceNotFoundError("Bus")

        operator = await operators_collection.find_one({"user_id": current_user["_id"]})
        if not operator or bus["operator_id"] != operator["_id"]:
            raise AuthorizationError("You can only access tickets for your own routes")

    # Get route details
    route = await routes_collection.find_one({"_id": ticket["route_id"]})
    if not route:
        raise ResourceNotFoundError("Route")

    # Get bus details
    bus = await buses_collection.find_one({"_id": route["bus_id"]})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # Get operator details
    operator = await operators_collection.find_one({"_id": bus["operator_id"]})
    if not operator:
        raise ResourceNotFoundError("Operator")

    # Get user details for operator
    operator_user = await users_collection.find_one({"_id": operator["user_id"]})

    # Create response with details
    ticket_with_details = TicketWithDetails(
        **ticket,
        route_details={
            "id": str(route["_id"]),
            "start_location": route["start_location"],
            "end_location": route["end_location"],
            "departure_time": route["departure_time"],
            "arrival_time": route["arrival_time"],
            "distance": route["distance"],
            "duration": route["duration"],
        },
        bus_details={
            "id": str(bus["_id"]),
            "plate_number": bus["plate_number"],
            "model": bus["model"],
            "capacity": bus["capacity"],
        },
        operator_details={
            "id": str(operator["_id"]),
            "company_name": operator["company_name"],
            "contact_phone": operator["contact_phone"],
            "user_name": operator_user["name"] if operator_user else "Unknown",
        },
    )

    return ticket_with_details


@router.get("/reference/{booking_reference}", response_model=TicketWithDetails)
async def get_ticket_by_reference(
    booking_reference: str = Path(...),
    email: str = Query(...),
) -> Any:
    """
    Get a ticket by booking reference and email.
    This endpoint is for guest users to check their booking.
    """
    # Find ticket by booking reference
    ticket = await tickets_collection.find_one({"booking_reference": booking_reference})
    if not ticket:
        raise ResourceNotFoundError("Ticket")

    # Verify email matches
    if ticket.get("user_id"):
        # For registered users, check user email
        user = await users_collection.find_one({"_id": ticket["user_id"]})
        if not user or user["email"].lower() != email.lower():
            raise AuthorizationError("Email does not match booking reference")
    else:
        # For guest bookings, check guest email
        if (
            not ticket.get("guest_info")
            or ticket["guest_info"]["email"].lower() != email.lower()
        ):
            raise AuthorizationError("Email does not match booking reference")

    # Get route details
    route = await routes_collection.find_one({"_id": ticket["route_id"]})
    if not route:
        raise ResourceNotFoundError("Route")

    # Get bus details
    bus = await buses_collection.find_one({"_id": route["bus_id"]})
    if not bus:
        raise ResourceNotFoundError("Bus")

    # Get operator details
    operator = await operators_collection.find_one({"_id": bus["operator_id"]})
    if not operator:
        raise ResourceNotFoundError("Operator")

    # Get user details for operator
    operator_user = await users_collection.find_one({"_id": operator["user_id"]})

    # Create response with details
    ticket_with_details = TicketWithDetails(
        **ticket,
        route_details={
            "id": str(route["_id"]),
            "start_location": route["start_location"],
            "end_location": route["end_location"],
            "departure_time": route["departure_time"],
            "arrival_time": route["arrival_time"],
            "distance": route["distance"],
            "duration": route["duration"],
        },
        bus_details={
            "id": str(bus["_id"]),
            "plate_number": bus["plate_number"],
            "model": bus["model"],
            "capacity": bus["capacity"],
        },
        operator_details={
            "id": str(operator["_id"]),
            "company_name": operator["company_name"],
            "contact_phone": operator["contact_phone"],
            "user_name": operator_user["name"] if operator_user else "Unknown",
        },
    )

    return ticket_with_details


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_update: TicketUpdate,
    ticket_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_user),
) -> Any:
    """
    Update a ticket status or payment information.
    """
    # Get the ticket
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise ResourceNotFoundError("Ticket")

    # Check access permissions
    if current_user["role"] == "user" and (
        not ticket.get("user_id") or ticket["user_id"] != current_user["_id"]
    ):
        raise AuthorizationError("You can only update your own tickets")
    elif current_user["role"] == "operator":
        # Check if ticket is for a route operated by this operator
        route = await routes_collection.find_one({"_id": ticket["route_id"]})
        if not route:
            raise ResourceNotFoundError("Route")

        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus:
            raise ResourceNotFoundError("Bus")

        operator = await operators_collection.find_one({"user_id": current_user["_id"]})
        if not operator or bus["operator_id"] != operator["_id"]:
            raise AuthorizationError("You can only update tickets for your own routes")

    # Build update dictionary with only provided fields
    update_dict = {}

    # Update status
    if ticket_update.status:
        # Users can only cancel their tickets
        if current_user["role"] == "user" and ticket_update.status not in ["cancelled"]:
            raise AuthorizationError("You can only cancel your tickets")

        # Prevent cancellation if travel date is in the past
        travel_date = datetime.strptime(ticket["travel_date"], "%Y-%m-%d").date()
        if ticket_update.status == "cancelled" and travel_date < datetime.now().date():
            raise BusinessLogicError("Cannot cancel tickets for past dates")

        # Prevent cancellation if already completed
        if ticket["status"] == "completed" and ticket_update.status == "cancelled":
            raise BusinessLogicError("Cannot cancel a completed ticket")

        update_dict["status"] = ticket_update.status

    # Update payment info
    if ticket_update.payment:
        current_payment = ticket.get("payment", {})
        payment_update = {}

        # Update payment status
        if "status" in ticket_update.payment:
            payment_update["status"] = ticket_update.payment["status"]

        # Update payment method
        if "method" in ticket_update.payment:
            payment_update["method"] = ticket_update.payment["method"]

        # Update transaction ID
        if "transaction_id" in ticket_update.payment:
            payment_update["transaction_id"] = ticket_update.payment["transaction_id"]

        # If payment status is changing to paid, set paid_at timestamp
        if (
            payment_update.get("status") == "paid"
            and current_payment.get("status") != "paid"
        ):
            payment_update["paid_at"] = datetime.utcnow()

        # If specified in the update
        if "paid_at" in ticket_update.payment:
            payment_update["paid_at"] = ticket_update.payment["paid_at"]

        update_dict["payment"] = {**current_payment, **payment_update}

    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()

        # Update ticket
        await tickets_collection.update_one(
            {"_id": ObjectId(ticket_id)}, {"$set": update_dict}
        )

    # Get updated ticket
    updated_ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})

    return {"ticket": Ticket(**updated_ticket)}


@router.delete("/{ticket_id}")
async def cancel_ticket(
    ticket_id: str = Path(...), current_user: dict = Depends(deps.get_current_user)
) -> Any:
    """
    Cancel a ticket (doesn't delete, just changes status to cancelled).
    """
    # Get the ticket
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise ResourceNotFoundError("Ticket")

    # Check access permissions
    if current_user["role"] == "user" and (
        not ticket.get("user_id") or ticket["user_id"] != current_user["_id"]
    ):
        raise AuthorizationError("You can only cancel your own tickets")
    elif current_user["role"] == "operator":
        # Check if ticket is for a route operated by this operator
        route = await routes_collection.find_one({"_id": ticket["route_id"]})
        if not route:
            raise ResourceNotFoundError("Route")

        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus:
            raise ResourceNotFoundError("Bus")

        operator = await operators_collection.find_one({"user_id": current_user["_id"]})
        if not operator or bus["operator_id"] != operator["_id"]:
            raise AuthorizationError("You can only cancel tickets for your own routes")

    # Check if ticket is already cancelled or completed
    if ticket["status"] == "cancelled":
        return {"message": "Ticket already cancelled"}
    if ticket["status"] == "completed":
        raise BusinessLogicError("Cannot cancel a completed ticket")

    # Check if travel date is in the past
    travel_date = datetime.strptime(ticket["travel_date"], "%Y-%m-%d").date()
    if travel_date < datetime.now().date():
        raise BusinessLogicError("Cannot cancel tickets for past dates")

    # Update ticket to cancelled
    await tickets_collection.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": datetime.utcnow(),
                "payment.status": (
                    "refunded" if ticket["payment"]["status"] == "paid" else "cancelled"
                ),
            }
        },
    )

    return {"message": "Ticket cancelled successfully"}


@router.post("/{ticket_id}/check-in", response_model=TicketResponse)
async def check_in_ticket(
    ticket_id: str = Path(...),
    current_user: dict = Depends(deps.get_current_operator_or_admin),
) -> Any:
    """
    Check in a passenger (mark ticket as scanned).
    Only operators or admins can perform this action.
    """
    # Get the ticket
    ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise ResourceNotFoundError("Ticket")

    # Check if ticket is booked
    if ticket["status"] != "booked":
        raise BusinessLogicError(
            f"Cannot check in a ticket with status: {ticket['status']}"
        )

    # If user is an operator, ensure they operate this route
    if not current_user.get("is_admin", False):
        # Check if ticket is for a route operated by this operator
        route = await routes_collection.find_one({"_id": ticket["route_id"]})
        if not route:
            raise ResourceNotFoundError("Route")

        bus = await buses_collection.find_one({"_id": route["bus_id"]})
        if not bus:
            raise ResourceNotFoundError("Bus")

        if bus["operator_id"] != current_user["operator"]["_id"]:
            raise AuthorizationError(
                "You can only check in passengers for your own routes"
            )

    # Check if travel date is today
    travel_date = datetime.strptime(ticket["travel_date"], "%Y-%m-%d").date()
    today = datetime.now().date()

    if travel_date != today:
        raise BusinessLogicError("Can only check in passengers on the day of travel")

    # Create boarding pass if it doesn't exist
    boarding_pass = ticket.get("boarding_pass", {})
    boarding_pass["scanned"] = True
    boarding_pass["scanned_at"] = datetime.utcnow()

    # Generate QR code URL if not present
    if not boarding_pass.get("qr_code"):
        boarding_pass["qr_code"] = f"qr/ticket/{ticket['booking_reference']}"

    # Update ticket status to completed and save boarding pass
    await tickets_collection.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "status": "completed",
                "boarding_pass": boarding_pass,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    # Get updated ticket
    updated_ticket = await tickets_collection.find_one({"_id": ObjectId(ticket_id)})

    return {"ticket": Ticket(**updated_ticket)}
