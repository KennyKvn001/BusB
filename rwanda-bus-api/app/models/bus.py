from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime
from bson import ObjectId

from app.models.user import PyObjectId, MongoBaseModel


# GeoLocation model
class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

    @validator("coordinates")
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError("Coordinates must be [longitude, latitude]")
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v


# Bus models
class BusBase(BaseModel):
    plate_number: str
    capacity: int
    model: str
    year: Optional[int] = None
    features: Optional[List[str]] = None

    @validator("capacity")
    def validate_capacity(cls, v):
        if v < 1:
            raise ValueError("Capacity must be at least 1")
        return v

    @validator("plate_number")
    def validate_plate_number(cls, v):
        # Rwanda license plate format: RAA123A or RAA 123A
        import re

        if not re.match(r"^R[A-Z]{2}\s?[0-9]{3}[A-Z]$", v):
            raise ValueError("Invalid Rwanda license plate format (e.g., RAA123A)")
        return v.replace(" ", "")  # Normalize by removing spaces


class BusCreate(BusBase):
    operator_id: Optional[str] = None  # Will be set from the authenticated operator


class BusUpdate(BaseModel):
    plate_number: Optional[str] = None
    capacity: Optional[int] = None
    model: Optional[str] = None
    year: Optional[int] = None
    features: Optional[List[str]] = None
    status: Optional[str] = None

    @validator("capacity")
    def validate_capacity(cls, v):
        if v is not None and v < 1:
            raise ValueError("Capacity must be at least 1")
        return v

    @validator("plate_number")
    def validate_plate_number(cls, v):
        if v is None:
            return v
        # Rwanda license plate format: RAA123A or RAA 123A
        import re

        if not re.match(r"^R[A-Z]{2}\s?[0-9]{3}[A-Z]$", v):
            raise ValueError("Invalid Rwanda license plate format (e.g., RAA123A)")
        return v.replace(" ", "")  # Normalize by removing spaces

    @validator("status")
    def validate_status(cls, v):
        if v is not None and v not in ["active", "maintenance", "inactive"]:
            raise ValueError("Status must be one of: active, maintenance, inactive")
        return v


class BusInDB(BusBase, MongoBaseModel):
    operator_id: PyObjectId
    status: str = "active"
    images: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Bus(BusBase, MongoBaseModel):
    operator_id: PyObjectId
    status: str
    images: List[str] = []
    created_at: datetime
    updated_at: datetime


# Response models
class BusResponse(BaseModel):
    bus: Bus


class BusListResponse(BaseModel):
    buses: List[Bus]
    total: int
    page: int
    page_size: int
    total_pages: int


# Bus with availability information
class BusWithAvailability(Bus):
    available_seats: int
    total_routes: int
    active_routes: int
