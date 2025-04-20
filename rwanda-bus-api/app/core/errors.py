from typing import Any, Dict, Optional


class CustomException(Exception):
    """
    Base exception class for all custom exceptions
    """

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = code or "error"
        self.details = details
        super().__init__(self.message)


# Authentication and Authorization Errors
class AuthenticationError(CustomException):
    """Exception raised for authentication errors."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401, code="authentication_error")


class AuthorizationError(CustomException):
    """Exception raised for authorization errors."""

    def __init__(
        self, message: str = "You don't have permission to perform this action"
    ):
        super().__init__(message=message, status_code=403, code="authorization_error")


class TokenExpiredError(CustomException):
    """Exception raised when token is expired."""

    def __init__(self, message: str = "Token has expired"):
        super().__init__(message=message, status_code=401, code="token_expired")


class InvalidTokenError(CustomException):
    """Exception raised when token is invalid."""

    def __init__(self, message: str = "Invalid token"):
        super().__init__(message=message, status_code=401, code="invalid_token")


# Resource Errors
class ResourceNotFoundError(CustomException):
    """Exception raised when a resource is not found."""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} not found", status_code=404, code="resource_not_found"
        )


class ResourceAlreadyExistsError(CustomException):
    """Exception raised when a resource already exists."""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} already exists",
            status_code=409,
            code="resource_already_exists",
        )


# Validation Errors
class ValidationError(CustomException):
    """Exception raised for validation errors."""

    def __init__(
        self,
        message: str = "Validation error",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message, status_code=422, code="validation_error", details=details
        )


# Business Logic Errors
class BusinessLogicError(CustomException):
    """Exception raised for business logic errors."""

    def __init__(self, message: str = "Business logic error"):
        super().__init__(message=message, status_code=400, code="business_logic_error")


class InsufficientSeatsError(BusinessLogicError):
    """Exception raised when there are insufficient seats available."""

    def __init__(self, message: str = "Insufficient seats available"):
        super().__init__(message=message)
        self.code = "insufficient_seats"


class PaymentError(BusinessLogicError):
    """Exception raised for payment processing errors."""

    def __init__(self, message: str = "Payment processing failed"):
        super().__init__(message=message)
        self.code = "payment_error"


class BookingError(BusinessLogicError):
    """Exception raised for booking errors."""

    def __init__(self, message: str = "Booking failed"):
        super().__init__(message=message)
        self.code = "booking_error"


# Database Errors
class DatabaseError(CustomException):
    """Exception raised for database errors."""

    def __init__(self, message: str = "Database error"):
        super().__init__(message=message, status_code=500, code="database_error")


# Server Errors
class ServerError(CustomException):
    """Exception raised for server errors."""

    def __init__(self, message: str = "Internal server error"):
        super().__init__(message=message, status_code=500, code="server_error")
