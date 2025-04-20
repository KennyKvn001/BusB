from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from bson import ObjectId
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from app.models.user import PyObjectId

# Define generic types for models
ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base class that can be extended to provide CRUD operations on MongoDB collections.
    """

    def __init__(self, collection: Any, model: Type[ModelType]):
        """
        Initialize with the MongoDB collection and the model.

        Args:
            collection: MongoDB collection
            model: Pydantic model class for this collection
        """
        self.collection = collection
        self.model = model

    async def get(self, id: str) -> Optional[ModelType]:
        """
        Get a document by id.

        Args:
            id: Object ID string

        Returns:
            Model instance or None if not found
        """
        if not ObjectId.is_valid(id):
            return None

        result = await self.collection.find_one({"_id": ObjectId(id)})
        if not result:
            return None
        return self.model(**result)

    async def get_by_field(self, field: str, value: Any) -> Optional[ModelType]:
        """
        Get a document by a specific field value.

        Args:
            field: Field name to query
            value: Value to match

        Returns:
            Model instance or None if not found
        """
        result = await self.collection.find_one({field: value})
        if not result:
            return None
        return self.model(**result)

    async def get_multi(
        self,
        query: Dict = {},
        skip: int = 0,
        limit: int = 100,
        sort_field: str = "created_at",
        sort_direction: int = -1,
    ) -> List[ModelType]:
        """
        Get multiple documents with pagination.

        Args:
            query: MongoDB query dict
            skip: Number of records to skip
            limit: Max number of records to return
            sort_field: Field to sort by
            sort_direction: Sort direction (1 for ascending, -1 for descending)

        Returns:
            List of model instances
        """
        results = []
        cursor = (
            self.collection.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sort_field, sort_direction)
        )

        async for document in cursor:
            results.append(self.model(**document))

        return results

    async def count(self, query: Dict = {}) -> int:
        """
        Count documents matching a query.

        Args:
            query: MongoDB query dict

        Returns:
            Count of matching documents
        """
        return await self.collection.count_documents(query)

    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new document.

        Args:
            obj_in: Create schema instance

        Returns:
            Created model instance
        """
        # Convert to dict and add timestamps
        obj_dict = obj_in.dict()
        now = datetime.utcnow()

        if "created_at" not in obj_dict:
            obj_dict["created_at"] = now

        if "updated_at" not in obj_dict:
            obj_dict["updated_at"] = now

        # Insert into collection
        result = await self.collection.insert_one(obj_dict)

        # Get the created document
        created_doc = await self.collection.find_one({"_id": result.inserted_id})
        return self.model(**created_doc)

    async def update(
        self, id: str, obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> Optional[ModelType]:
        """
        Update a document.

        Args:
            id: Object ID string
            obj_in: Update schema instance or dict

        Returns:
            Updated model instance or None if not found
        """
        if not ObjectId.is_valid(id):
            return None

        # Check if document exists
        existing_doc = await self.collection.find_one({"_id": ObjectId(id)})
        if not existing_doc:
            return None

        # Convert to dict if it's a model
        update_data = obj_in
        if isinstance(obj_in, BaseModel):
            update_data = obj_in.dict(exclude_unset=True)

        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()

        # Update document
        await self.collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})

        # Get the updated document
        updated_doc = await self.collection.find_one({"_id": ObjectId(id)})
        return self.model(**updated_doc)

    async def delete(self, id: str) -> bool:
        """
        Delete a document.

        Args:
            id: Object ID string

        Returns:
            True if deleted, False if not found
        """
        if not ObjectId.is_valid(id):
            return False

        result = await self.collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0

    async def bulk_create(self, objs_in: List[CreateSchemaType]) -> List[ModelType]:
        """
        Create multiple documents in bulk.

        Args:
            objs_in: List of create schema instances

        Returns:
            List of created model instances
        """
        # Convert to dicts and add timestamps
        now = datetime.utcnow()
        docs = []

        for obj in objs_in:
            obj_dict = obj.dict()

            if "created_at" not in obj_dict:
                obj_dict["created_at"] = now

            if "updated_at" not in obj_dict:
                obj_dict["updated_at"] = now

            docs.append(obj_dict)

        # Insert into collection
        result = await self.collection.insert_many(docs)

        # Get the created documents
        created_docs = []
        async for doc in self.collection.find(
            {"_id": {"$in": list(result.inserted_ids)}}
        ):
            created_docs.append(self.model(**doc))

        return created_docs

    async def exists(self, id: str) -> bool:
        """
        Check if a document exists.

        Args:
            id: Object ID string

        Returns:
            True if exists, False otherwise
        """
        if not ObjectId.is_valid(id):
            return False

        count = await self.collection.count_documents({"_id": ObjectId(id)})
        return count > 0

    async def exists_by_field(self, field: str, value: Any) -> bool:
        """
        Check if a document exists by field value.

        Args:
            field: Field name to query
            value: Value to match

        Returns:
            True if exists, False otherwise
        """
        count = await self.collection.count_documents({field: value})
        return count > 0

    async def aggregate(self, pipeline: List[Dict]) -> List[Dict]:
        """
        Perform an aggregation pipeline query.

        Args:
            pipeline: MongoDB aggregation pipeline

        Returns:
            List of aggregation results
        """
        return await self.collection.aggregate(pipeline).to_list(length=None)
