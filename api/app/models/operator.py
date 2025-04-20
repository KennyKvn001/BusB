from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from bson import ObjectId

from app.models.user import PyObjectId, MongoBaseModel, User


# Address models
class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

    @validator("type")
    def validate_type(cls, v):
        if v != "Point":
            raise ValueError("Type must be Point for GeoJSON")
        return v

    @validator("coordinates")
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError("Coordinates must be [longitude, latitude]")
        if not (-180 <= v[0] <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= v[1] <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v


class Address(BaseModel):
    street: Optional[str] = None
    city: str
    province: str
    country: str = "Rwanda"
    coordinates: Optional[GeoLocation] = None


# Operator models
class OperatorBase(BaseModel):
    company_name: str
    contact_phone: str
    license_number: str
    address: Optional[Address] = None


class OperatorCreate(OperatorBase):
    user_id: str


class OperatorUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_phone: Optional[str] = None
    license_number: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

    @validator("status")
    def validate_status(cls, v):
        if v not in [None, "pending", "approved", "suspended"]:
            raise ValueError("Status must be one of: pending, approved, suspended")
        return v


class OperatorInDB(OperatorBase, MongoBaseModel):
    user_id: PyObjectId
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Operator(OperatorBase, MongoBaseModel):
    user_id: PyObjectId
    status: str
    created_at: datetime
    updated_at: datetime


# Full operator with user details
class OperatorWithUser(Operator):
    user: User


# Response models
class OperatorCreateResponse(BaseModel):
    operator: Operator
    message: str = "Operator profile created successfully. Awaiting approval."


class OperatorListResponse(BaseModel):
    operators: List[Operator]
    total: int
    page: int
    page_size: int
    total_pages: int
