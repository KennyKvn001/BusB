from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from bson import ObjectId

from app.models.user import PyObjectId, MongoBaseModel


class ReviewBase(BaseModel):
    ticket_id: str
    rating: int
    comment: Optional[str] = None

    @validator("rating")
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

    @validator("rating")
    def validate_rating(cls, v):
        if v is not None and not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewInDB(ReviewBase, MongoBaseModel):
    user_id: PyObjectId
    route_id: PyObjectId
    bus_id: PyObjectId
    operator_id: PyObjectId
    ticket_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Review(ReviewBase, MongoBaseModel):
    user_id: PyObjectId
    route_id: PyObjectId
    bus_id: PyObjectId
    operator_id: PyObjectId
    ticket_id: PyObjectId
    created_at: datetime
    updated_at: datetime


# Response models
class ReviewResponse(BaseModel):
    review: Review


class ReviewListResponse(BaseModel):
    reviews: List[Review]
    total: int
    page: int
    page_size: int
    total_pages: int


# Review with additional info
class ReviewWithDetails(Review):
    route_details: Dict[str, Any]
    bus_details: Dict[str, Any]
    operator_details: Dict[str, Any]
    user_details: Dict[str, Any]
