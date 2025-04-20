from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Body, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    verify_token,
)
from app.core.errors import (
    AuthenticationError,
    TokenExpiredError,
    InvalidTokenError,
    ResourceNotFoundError,
)
from app.models.user import (
    User,
    UserCreate,
    UserInDB,
    Token,
    RefreshToken,
    UserCreateResponse,
)
from app.core.database import users_collection
from app.api import deps

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_in: UserCreate) -> Any:
    """
    Register a new user.
    """
    # Check if user with this email already exists
    existing_user = await users_collection.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    # Create new user
    user_dict = user_in.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = user_dict["created_at"]

    # Insert user into database
    result = await users_collection.insert_one(user_dict)

    # Create tokens
    access_token = create_access_token(subject=str(result.inserted_id))
    refresh_token = create_refresh_token(subject=str(result.inserted_id))

    # Get the created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})

    # Convert to Pydantic model and remove password
    user = User(**created_user)

    return {"user": user, "access_token": access_token, "refresh_token": refresh_token}


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Find user by email
    user = await users_collection.find_one({"email": form_data.username})
    if not user:
        raise AuthenticationError("Incorrect email or password")

    # Check password
    if not verify_password(form_data.password, user["password"]):
        raise AuthenticationError("Incorrect email or password")

    # Check if user is active
    if user.get("status") != "active":
        raise AuthenticationError("Account is inactive")

    # Update last login time
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}},
    )

    # Create tokens
    access_token = create_access_token(subject=str(user["_id"]))
    refresh_token = create_refresh_token(subject=str(user["_id"]))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh-token", response_model=Token)
async def refresh_token(refresh_token_in: RefreshToken = Body(...)) -> Any:
    """
    Refresh access token.
    """
    # Verify refresh token
    token_data = verify_token(refresh_token_in.refresh_token, "refresh")
    if not token_data:
        raise InvalidTokenError()

    # Get user from token
    user = await users_collection.find_one({"_id": ObjectId(token_data.sub)})
    if not user:
        raise ResourceNotFoundError("User")

    # Create new tokens
    access_token = create_access_token(subject=token_data.sub)
    refresh_token = create_refresh_token(subject=token_data.sub)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Logout current user. This is just a placeholder since JWT tokens cannot be invalidated.
    In a real-world application, you might want to use a token blacklist or implement
    a refresh token rotation strategy.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user info.
    """
    return current_user
