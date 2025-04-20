from typing import Optional, Union, List
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError

from app.core.config import settings
from app.core.security import verify_token
from app.core.errors import (
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
)
from app.models.user import User, TokenPayload
from app.core.database import (
    users_collection,
    operators_collection,
    buses_collection,
    routes_collection,
)

# OAuth2 token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get the current user from JWT token.
    """
    # Verify token
    token_data = verify_token(token, "access")
    if not token_data:
        raise AuthenticationError()

    # Get user from token
    user = await users_collection.find_one({"_id": ObjectId(token_data.sub)})
    if not user:
        raise ResourceNotFoundError("User")

    # Check if user is active
    if user.get("status") != "active":
        raise AuthenticationError("Account is inactive")

    return User(**user)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """
    Get the current user from JWT token or None if not authenticated.
    Used for endpoints that work for both authenticated and unauthenticated users.
    """
    if not token:
        return None

    try:
        return await get_current_user(token)
    except (AuthenticationError, ResourceNotFoundError):
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user.
    """
    if current_user.status != "active":
        raise AuthenticationError("Account is inactive")

    return current_user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current admin user.
    """
    if current_user.role != "admin":
        raise AuthorizationError("Admin privileges required")

    return current_user


async def get_current_operator(current_user: User = Depends(get_current_user)) -> dict:
    """
    Get the current operator user with operator profile.
    """
    if current_user.role != "operator":
        raise AuthorizationError("Operator privileges required")

    # Get operator profile
    operator = await operators_collection.find_one({"user_id": current_user.id})
    if not operator:
        raise ResourceNotFoundError("Operator profile")

    # Check if operator is approved
    if operator.get("status") != "approved":
        raise AuthorizationError("Operator account not approved")

    return {"user": current_user, "operator": operator}


async def get_current_operator_or_admin(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get the current operator or admin user.
    """
    if current_user.role == "admin":
        return {"user": current_user, "operator": None, "is_admin": True}

    if current_user.role != "operator":
        raise AuthorizationError("Operator or admin privileges required")

    # Get operator profile
    operator = await operators_collection.find_one({"user_id": current_user.id})
    if not operator:
        raise ResourceNotFoundError("Operator profile")

    # Check if operator is approved
    if operator.get("status") != "approved":
        raise AuthorizationError("Operator account not approved")

    return {"user": current_user, "operator": operator, "is_admin": False}


async def check_bus_ownership(
    bus_id: str, current_user: User = Depends(get_current_user)
) -> bool:
    """
    Check if the current user owns the specified bus.
    """
    if current_user.role == "admin":
        return True

    if current_user.role != "operator":
        return False

    # Get operator profile
    operator = await operators_collection.find_one({"user_id": current_user.id})
    if not operator:
        return False

    # Check if bus belongs to operator
    bus = await buses_collection.find_one(
        {"_id": ObjectId(bus_id), "operator_id": operator["_id"]}
    )

    return bus is not None


async def check_route_ownership(
    route_id: str, current_user: User = Depends(get_current_user)
) -> bool:
    """
    Check if the current user owns the specified route.
    """
    if current_user.role == "admin":
        return True

    if current_user.role != "operator":
        return False

    # Get operator profile
    operator = await operators_collection.find_one({"user_id": current_user.id})
    if not operator:
        return False

    # Get route
    route = await routes_collection.find_one({"_id": ObjectId(route_id)})
    if not route:
        return False

    # Check if bus belongs to operator
    bus = await buses_collection.find_one(
        {"_id": route["bus_id"], "operator_id": operator["_id"]}
    )

    return bus is not None
