"""Appwrite database client and operations."""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
from appwrite.id import ID
from typing import List, Optional
from datetime import datetime
import json

from config import Config
from models import Todo, Reminder, TodoPriority, ReminderImportance


class AppwriteClient:
    """Appwrite database client wrapper."""
    
    def __init__(self):
        """Initialize Appwrite client."""
        self.client = Client()
        self.client.set_endpoint(Config.APPWRITE_ENDPOINT)
        self.client.set_project(Config.APPWRITE_PROJECT_ID)
        self.client.set_key(Config.APPWRITE_API_KEY)
        
        self.databases = Databases(self.client)
        self.database_id = Config.APPWRITE_DATABASE_ID
    
    # Todo operations
    
    def create_todo(
        self,
        title: str,
        description: Optional[str] = None,
        priority: TodoPriority = TodoPriority.MEDIUM,
        due_date: Optional[datetime] = None,
    ) -> Todo:
        """Create a new todo item."""
        document_id = ID.unique()
        now = datetime.utcnow()
        
        data = {
            "title": title,
            "description": description,
            "completed": False,
            "priority": priority.value,
            "due_date": due_date.isoformat() if due_date else None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        
        result = self.databases.create_document(
            database_id=self.database_id,
            collection_id=Config.APPWRITE_TODOS_COLLECTION_ID,
            document_id=document_id,
            data=data,
        )
        
        return self._document_to_todo(result)
    
    def get_todos(self, completed: Optional[bool] = None) -> List[Todo]:
        """Get all todos, optionally filtered by completion status."""
        queries = []
        if completed is not None:
            queries.append(Query.equal("completed", completed))
        
        queries.append(Query.order_desc("created_at"))
        
        result = self.databases.list_documents(
            database_id=self.database_id,
            collection_id=Config.APPWRITE_TODOS_COLLECTION_ID,
            queries=queries,
        )
        
        return [self._document_to_todo(doc) for doc in result["documents"]]
    
    def get_todo(self, todo_id: str) -> Optional[Todo]:
        """Get a specific todo by ID."""
        try:
            result = self.databases.get_document(
                database_id=self.database_id,
                collection_id=Config.APPWRITE_TODOS_COLLECTION_ID,
                document_id=todo_id,
            )
            return self._document_to_todo(result)
        except Exception as e:
            print(f"Error getting todo {todo_id}: {e}")
            return None
    
    def update_todo(
        self,
        todo_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        completed: Optional[bool] = None,
        priority: Optional[TodoPriority] = None,
        due_date: Optional[datetime] = None,
    ) -> Optional[Todo]:
        """Update a todo item."""
        data = {"updated_at": datetime.utcnow().isoformat()}
        
        if title is not None:
            data["title"] = title
        if description is not None:
            data["description"] = description
        if completed is not None:
            data["completed"] = completed
        if priority is not None:
            data["priority"] = priority.value
        if due_date is not None:
            data["due_date"] = due_date.isoformat()
        
        try:
            result = self.databases.update_document(
                database_id=self.database_id,
                collection_id=Config.APPWRITE_TODOS_COLLECTION_ID,
                document_id=todo_id,
                data=data,
            )
            return self._document_to_todo(result)
        except Exception as e:
            print(f"Error updating todo {todo_id}: {e}")
            return None
    
    def complete_todo(self, todo_id: str) -> Optional[Todo]:
        """Mark a todo as completed."""
        return self.update_todo(todo_id, completed=True)
    
    def delete_todo(self, todo_id: str) -> bool:
        """Delete a todo item."""
        try:
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=Config.APPWRITE_TODOS_COLLECTION_ID,
                document_id=todo_id,
            )
            return True
        except Exception as e:
            print(f"Error deleting todo {todo_id}: {e}")
            return False
    
    # Reminder operations
    
    def create_reminder(
        self,
        reminder_text: str,
        importance: ReminderImportance = ReminderImportance.MEDIUM,
        reminder_date: Optional[datetime] = None,
    ) -> Reminder:
        """Create a new reminder."""
        document_id = ID.unique()
        now = datetime.utcnow()
        
        data = {
            "reminder_text": reminder_text,
            "importance": importance.value,
            "reminder_date": reminder_date.isoformat() if reminder_date else None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        
        result = self.databases.create_document(
            database_id=self.database_id,
            collection_id=Config.APPWRITE_REMINDERS_COLLECTION_ID,
            document_id=document_id,
            data=data,
        )
        
        return self._document_to_reminder(result)
    
    def get_reminders(self) -> List[Reminder]:
        """Get all reminders."""
        result = self.databases.list_documents(
            database_id=self.database_id,
            collection_id=Config.APPWRITE_REMINDERS_COLLECTION_ID,
            queries=[Query.order_desc("created_at")],
        )
        
        return [self._document_to_reminder(doc) for doc in result["documents"]]
    
    def get_reminder(self, reminder_id: str) -> Optional[Reminder]:
        """Get a specific reminder by ID."""
        try:
            result = self.databases.get_document(
                database_id=self.database_id,
                collection_id=Config.APPWRITE_REMINDERS_COLLECTION_ID,
                document_id=reminder_id,
            )
            return self._document_to_reminder(result)
        except Exception as e:
            print(f"Error getting reminder {reminder_id}: {e}")
            return None
    
    def delete_reminder(self, reminder_id: str) -> bool:
        """Delete a reminder."""
        try:
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=Config.APPWRITE_REMINDERS_COLLECTION_ID,
                document_id=reminder_id,
            )
            return True
        except Exception as e:
            print(f"Error deleting reminder {reminder_id}: {e}")
            return False
    
    # Helper methods
    
    def _document_to_todo(self, doc: dict) -> Todo:
        """Convert Appwrite document to Todo model."""
        return Todo(
            id=doc["$id"],
            title=doc["title"],
            description=doc.get("description"),
            completed=doc.get("completed", False),
            priority=TodoPriority(doc.get("priority", "medium")),
            due_date=datetime.fromisoformat(doc["due_date"]) if doc.get("due_date") else None,
            created_at=datetime.fromisoformat(doc["created_at"]) if doc.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(doc["updated_at"]) if doc.get("updated_at") else datetime.utcnow(),
        )
    
    def _document_to_reminder(self, doc: dict) -> Reminder:
        """Convert Appwrite document to Reminder model."""
        return Reminder(
            id=doc["$id"],
            reminder_text=doc["reminder_text"],
            importance=ReminderImportance(doc.get("importance", "medium")),
            reminder_date=datetime.fromisoformat(doc["reminder_date"]) if doc.get("reminder_date") else None,
            created_at=datetime.fromisoformat(doc["created_at"]) if doc.get("created_at") else datetime.utcnow(),
            updated_at=datetime.fromisoformat(doc["updated_at"]) if doc.get("updated_at") else datetime.utcnow(),
        )


# Global database client instance
db_client = AppwriteClient()

