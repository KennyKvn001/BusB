from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime, time
from bson import ObjectId

from app.models.user import PyObjectId, MongoBaseModel
from app.models.bus import GeoLocation


class LocationPoint(BaseModel):
    name: str
    coordinates: GeoLocation


class RouteStop(LocationPoint):
    arrival_time: Optional[str] = None  # Format: "HH:MM"
    departure_time: Optional[str] = None  # Format: "HH:MM"

    @validator("arrival_time", "departure_time")
    def validate_time_format(cls, v):
        if v is None:
            return v
        try:
            # Check if time is in HH:MM format
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")


class RouteBase(BaseModel):
    start_location: LocationPoint
    end_location: LocationPoint
    stops: Optional[List[RouteStop]] = []
    distance: float  # in kilometers
    duration: int  # in minutes
    price: float  # in Rwandan Francs
    schedule_days: List[str]  # ["Monday", "Tuesday", ...]
    departure_time: str  # Format: "HH:MM"
    arrival_time: str  # Format: "HH:MM"
    is_popular: bool = False

    @validator("schedule_days")
    def validate_schedule_days(cls, v):
        valid_days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]
        for day in v:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}. Must be one of {valid_days}")
        return v

    @validator("departure_time", "arrival_time")
    def validate_time_format(cls, v):
        try:
            # Check if time is in HH:MM format
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")

    @validator("distance")
    def validate_distance(cls, v):
        if v <= 0:
            raise ValueError("Distance must be greater than 0")
        return v

    @validator("duration")
    def validate_duration(cls, v):
        if v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v

    @validator("price")
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


class RouteCreate(RouteBase):
    bus_id: str


class RouteUpdate(BaseModel):
    start_location: Optional[Dict[str, Any]] = None
    end_location: Optional[Dict[str, Any]] = None
    stops: Optional[List[Dict[str, Any]]] = None
    distance: Optional[float] = None
    duration: Optional[int] = None
    price: Optional[float] = None
    schedule_days: Optional[List[str]] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    status: Optional[str] = None
    bus_id: Optional[str] = None
    is_popular: Optional[bool] = None

    @validator("schedule_days")
    def validate_schedule_days(cls, v):
        if v is None:
            return v
        valid_days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]
        for day in v:
            if day not in valid_days:
                raise ValueError(f"Invalid day: {day}. Must be one of {valid_days}")
        return v

    @validator("departure_time", "arrival_time")
    def validate_time_format(cls, v):
        if v is None:
            return v
        try:
            # Check if time is in HH:MM format
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")

    @validator("distance")
    def validate_distance(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Distance must be greater than 0")
        return v

    @validator("duration")
    def validate_duration(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v

    @validator("price")
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @validator("status")
    def validate_status(cls, v):
        if v is not None and v not in ["active", "inactive", "seasonal"]:
            raise ValueError("Status must be one of: active, inactive, seasonal")
        return v


class RouteInDB(RouteBase, MongoBaseModel):
    bus_id: PyObjectId
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Route(RouteBase, MongoBaseModel):
    bus_id: PyObjectId
    status: str
    created_at: datetime
    updated_at: datetime


# Response models
class RouteResponse(BaseModel):
    route: Route


class RouteListResponse(BaseModel):
    routes: List[Route]
    total: int
    page: int
    page_size: int
    total_pages: int


# Route with additional info
class RouteWithDetails(Route):
    bus_details: Dict[str, Any]
    operator_details: Dict[str, Any]
    available_seats: int
