import motor.motor_asyncio
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from loguru import logger

from app.core.config import settings

# Create async MongoDB Atlas client
# The connection string should be in the format:
# mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

# Collection references
users_collection = db.users
operators_collection = db.operators
buses_collection = db.buses
routes_collection = db.routes
tickets_collection = db.tickets
reviews_collection = db.reviews


# Test database connection (synchronous)
def test_connection():
    try:
        # Use a synchronous client for testing the connection
        sync_client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        sync_client.admin.command("ping")
        logger.info("Successfully connected to MongoDB")
        return True
    except ConnectionFailure:
        logger.error("MongoDB connection failed")
        return False


# Create indexes - run this function on application startup
async def create_indexes():
    try:
        # Users Collection
        await users_collection.create_index("email", unique=True)

        # Operators Collection
        await operators_collection.create_index("user_id", unique=True)
        await operators_collection.create_index("license_number", unique=True)

        # Buses Collection
        await buses_collection.create_index("plate_number", unique=True)
        await buses_collection.create_index("operator_id")

        # Routes Collection
        await routes_collection.create_index("bus_id")
        await routes_collection.create_index(
            [("start_location.coordinates", "2dsphere")]
        )
        await routes_collection.create_index([("end_location.coordinates", "2dsphere")])

        # Tickets Collection
        await tickets_collection.create_index("booking_reference", unique=True)
        await tickets_collection.create_index("user_id")
        await tickets_collection.create_index("route_id")
        await tickets_collection.create_index("travel_date")

        # Reviews Collection
        await reviews_collection.create_index("user_id")
        await reviews_collection.create_index("ticket_id")
        await reviews_collection.create_index("route_id")

        logger.info("Successfully created MongoDB indexes")
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}")
