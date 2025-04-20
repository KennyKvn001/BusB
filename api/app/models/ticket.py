from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime, date
from bson import ObjectId
import re

from app.models.user import PyObjectId, MongoBaseModel


class GuestInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str


class PaymentInfo(BaseModel):
    status: str = "pending"  # pending, paid, refunded
    method: Optional[str] = None  # mobile_money, card, cash
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None


class BoardingPass(BaseModel):
    qr_code: Optional[str] = None
    scanned: bool = False
    scanned_at: Optional[datetime] = None


class TicketBase(BaseModel):
    route_id: str
    travel_date: date
    seat_number: int
    price: float

    @validator("price")
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @validator("seat_number")
    def validate_seat_number(cls, v):
        if v <= 0:
            raise ValueError("Seat number must be greater than 0")
        return v


class TicketCreate(TicketBase):
    user_id: Optional[str] = None  # Null for guest bookings
    guest_info: Optional[GuestInfo] = None

    @validator("guest_info")
    def validate_guest_info(cls, v, values):
        if not values.get("user_id") and not v:
            raise ValueError("Guest information is required for guest bookings")
        return v


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    payment: Optional[Dict[str, Any]] = None

    @validator("status")
    def validate_status(cls, v):
        if v and v not in ["booked", "cancelled", "completed"]:
            raise ValueError("Status must be one of: booked, cancelled, completed")
        return v


class TicketInDB(TicketBase, MongoBaseModel):
    booking_reference: str
    user_id: Optional[PyObjectId] = None
    guest_info: Optional[GuestInfo] = None
    status: str = "booked"
    payment: PaymentInfo = Field(default_factory=PaymentInfo)
    boarding_pass: BoardingPass = Field(default_factory=BoardingPass)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Ticket(TicketBase, MongoBaseModel):
    booking_reference: str
    user_id: Optional[PyObjectId] = None
    guest_info: Optional[GuestInfo] = None
    status: str
    payment: PaymentInfo
    boarding_pass: Optional[BoardingPass] = None
    created_at: datetime
    updated_at: datetime


# Response models
class TicketResponse(BaseModel):
    ticket: Ticket


class TicketListResponse(BaseModel):
    tickets: List[Ticket]
    total: int
    page: int
    page_size: int
    total_pages: int


# Ticket with route and bus details
class TicketWithDetails(Ticket):
    route_details: Dict[str, Any]
    bus_details: Dict[str, Any]
    operator_details: Dict[str, Any]


def generate_booking_reference() -> str:
    """
    Generate a unique booking reference.
    Format: RB-XXXXX where X is alphanumeric
    """
    import random
    import string

    chars = string.ascii_uppercase + string.digits
    reference = "RB-" + "".join(random.choice(chars) for _ in range(5))
    return reference
