from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import asyncio

from app.core.config import settings
from app.core.database import create_indexes
from app.core.errors import CustomException

from app.api import auth, users, buses, routes, tickets, reviews, admin

# Initialize FastAPI app
app = FastAPI(
    title="Rwanda Bus Booking API",
    description="RESTful API for a bus booking platform in Rwanda",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Explicitly allow the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handlers
@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "code": exc.code,
            "details": exc.details,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Validation error",
            "details": exc.errors(),
        },
    )


# Root route
@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "success",
        "message": "Welcome to Rwanda Bus Booking API",
        "version": "1.0.0",
        "documentation": "/docs",
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    # Create MongoDB indexes on startup
    await create_indexes()


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(buses.router, prefix=settings.API_V1_STR)
app.include_router(routes.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# For development - run with Uvicorn
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
