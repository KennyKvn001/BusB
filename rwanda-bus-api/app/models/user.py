from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from bson import ObjectId


# PyObjectId for MongoDB ObjectId handling
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# Base models with common functionality
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# User Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = "user"

    @validator("role")
    def validate_role(cls, v):
        if v not in ["user", "operator", "admin"]:
            raise ValueError("Role must be one of: user, operator, admin")
        return v


class UserCreate(UserBase):
    password: str

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase, MongoBaseModel):
    password: str
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class User(UserBase, MongoBaseModel):
    status: str = "active"
    created_at: datetime
    updated_at: datetime


# Token Models
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str


class RefreshToken(BaseModel):
    refresh_token: str


# Create User Response
class UserCreateResponse(BaseModel):
    user: User
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
