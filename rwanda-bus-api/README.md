# Rwanda Bus Booking Platform - Backend API

A RESTful API backend for a bus booking platform serving passengers, operators, and administrators in Rwanda using FastAPI, MongoDB Atlas, and JWT-based authentication.

## 🚍 Overview

This system provides a comprehensive backend for a bus booking service with the following key features:

- **Multi-user roles**: Passengers, bus operators, and administrators
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Atlas Integration**: Cloud-based scalable database
- **Role-based Access Control**: Different permissions for different user types
- **Bus & Route Management**: Complete CRUD operations
- **Ticket Booking System**: Both registered and guest booking options
- **Review System**: Rating and commenting for completed trips
- **Admin Dashboard**: Comprehensive statistics and system management

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Data Validation**: Pydantic
- **Password Security**: Bcrypt
- **Async Support**: Motor (async MongoDB driver)

## 📋 Features

### Authentication & Authorization

- JWT-based authentication
- Three user roles: `user` (passenger), `operator` (bus company), `admin`
- Role-based middleware for access control
- Anonymous (guest) bookings with email and name

### Core Models

- **User**: Authentication, profile, and role management
- **Operator**: Extended user profile for bus companies
- **Bus**: Vehicle information and capacity management
- **Route**: Transportation routes with schedules and locations
- **Ticket**: Booking information with payment status
- **Review**: Ratings and feedback system

### API Endpoints

#### Auth Routes

- **POST /api/auth/register**: Create new user account
- **POST /api/auth/login**: User login (get JWT token)
- **POST /api/auth/refresh-token**: Refresh access token
- **POST /api/auth/logout**: User logout
- **GET /api/auth/me**: Get current user info

#### User Routes

- **GET /api/users/me**: Get current user profile
- **PUT /api/users/me**: Update current user profile

#### Bus Management

- **POST /api/buses**: Add new bus (operators only)
- **GET /api/buses**: List buses (filtered by operator)
- **GET /api/buses/{bus_id}**: Get bus details
- **PUT /api/buses/{bus_id}**: Update bus information
- **DELETE /api/buses/{bus_id}**: Remove bus

#### Route Management

- **POST /api/routes**: Create new route
- **GET /api/routes**: List routes with filtering
- **GET /api/routes/search**: Search routes by location
- **GET /api/routes/{route_id}**: Get route details
- **PUT /api/routes/{route_id}**: Update route
- **DELETE /api/routes/{route_id}**: Delete route
- **GET /api/routes/{route_id}/availability**: Check seat availability

#### Ticket Booking

- **POST /api/tickets**: Book a ticket
- **GET /api/tickets**: List tickets (admin/operator)
- **GET /api/tickets/my-tickets**: Get user's tickets
- **GET /api/tickets/{ticket_id}**: Get ticket details
- **GET /api/tickets/reference/{booking_reference}**: Lookup by reference
- **PUT /api/tickets/{ticket_id}**: Update ticket status
- **DELETE /api/tickets/{ticket_id}**: Cancel ticket
- **POST /api/tickets/{ticket_id}/check-in**: Passenger check-in

#### Reviews

- **POST /api/reviews**: Create review
- **GET /api/reviews**: List reviews
- **GET /api/reviews/my-reviews**: Get user's reviews
- **GET /api/reviews/operator-reviews**: Get operator reviews
- **GET /api/reviews/{review_id}**: Get review details
- **PUT /api/reviews/{review_id}**: Update review
- **DELETE /api/reviews/{review_id}**: Delete review

#### Admin Functions

- **GET /api/admin/users**: List all users
- **GET /api/admin/users/{user_id}**: Get user details
- **PUT /api/admin/users/{user_id}/update-role**: Change user role
- **PUT /api/admin/users/{user_id}/update-status**: Update user status
- **GET /api/admin/operators**: List bus operators
- **PUT /api/admin/operators/{operator_id}/approve**: Approve operator
- **PUT /api/admin/operators/{operator_id}/suspend**: Suspend operator
- **GET /api/admin/statistics/overview**: System statistics
- **GET /api/admin/statistics/revenue**: Revenue reports
- **GET /api/admin/statistics/bookings**: Booking analytics

### Additional Features

- Geospatial search for routes
- Comprehensive input validation
- Detailed error responses
- Pagination for list endpoints

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- MongoDB Atlas account
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/rwanda-bus-api.git
   cd rwanda-bus-api
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following configuration:

   ```
   # FastAPI settings
   DEBUG=True
   API_V1_STR=/api
   PROJECT_NAME="Rwanda Bus Booking API"
   CORS_ORIGINS=http://localhost:3000,http://localhost:8080

   # MongoDB Atlas settings
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rwanda_bus_db?retryWrites=true&w=majority
   DATABASE_NAME=rwanda_bus_db

   # Security
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   REFRESH_TOKEN_EXPIRE_MINUTES=10080
   ```

5. Run the application:

   ```bash
   uvicorn main:app --reload
   ```

6. Open your browser and go to [http://localhost:8000/docs](http://localhost:8000/docs) to see API documentation

## 📐 Database Schema

The MongoDB database has the following collections:

1. **users**

   - Authentication and basic user information
   - `role` field identifies user type (user, operator, admin)

2. **operators**

   - Extended information for bus operators
   - Linked to users collection via `user_id`

3. **buses**

   - Bus details including capacity and status
   - Linked to operators collection via `operator_id`

4. **routes**

   - Route information with start/end locations and schedule
   - Uses GeoJSON for location data to enable spatial queries
   - Linked to buses collection via `bus_id`

5. **tickets**

   - Booking information including seat number and payment status
   - Can be linked to users (for registered users) or contain guest info

6. **reviews**
   - Ratings and feedback for completed journeys
   - Linked to tickets, routes, and users

## 🧰 Project Structure

```
rwanda-bus-api/
│
├── app/                          # Main application folder
│   ├── __init__.py
│   │
│   ├── core/                     # Core application modules
│   │   ├── config.py             # Configuration settings
│   │   ├── security.py           # JWT, hashing, authentication
│   │   ├── database.py           # MongoDB connection
│   │   └── errors.py             # Custom error handling
│   │
│   ├── api/                      # API routes and endpoints
│   │   ├── deps.py               # Dependency injection
│   │   ├── auth.py               # Authentication routes
│   │   ├── users.py              # User management routes
│   │   ├── buses.py              # Bus management routes
│   │   ├── routes.py             # Route management endpoints
│   │   ├── tickets.py            # Ticket booking endpoints
│   │   ├── reviews.py            # Review endpoints
│   │   └── admin.py              # Admin-specific endpoints
│   │
│   ├── models/                   # Pydantic models
│   │   ├── user.py               # User model schemas
│   │   ├── operator.py           # Operator model schemas
│   │   ├── bus.py                # Bus model schemas
│   │   ├── route.py              # Route model schemas
│   │   ├── ticket.py             # Ticket model schemas
│   │   └── review.py             # Review model schemas
│   │
│   └── crud/                     # Database operations
│       └── base.py               # Base CRUD operations
│
├── tests/                        # Test modules
├── .env                          # Environment variables
├── requirements.txt              # Project dependencies
├── main.py                       # Application entry point
└── README.md                     # Project documentation
```

## 📋 API Documentation

After starting the application, detailed API documentation is available at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🛡️ Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Middleware to restrict access based on user role
- **Input Validation**: All inputs are validated using Pydantic models
- **MongoDB Atlas Security**: Industry-standard database security

## 📱 Front-end Integration

This backend is designed to work with any front-end technology. Frontend developers can use the API documentation to understand all available endpoints.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud database service
- [Python-Jose](https://python-jose.readthedocs.io/) - JavaScript Object Signing and Encryption
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation
- [Motor](https://motor.readthedocs.io/) - Async MongoDB driver
