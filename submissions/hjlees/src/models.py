"""Data models for the application."""
from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class TodoPriority(str, Enum):
    """Todo priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ReminderImportance(str, Enum):
    """Reminder importance levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Todo(BaseModel):
    """Todo item model."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: TodoPriority = TodoPriority.MEDIUM
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Reminder(BaseModel):
    """Reminder model."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    reminder_text: str
    importance: ReminderImportance = ReminderImportance.MEDIUM
    reminder_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationMessage(BaseModel):
    """Conversation message model."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AgoraToken(BaseModel):
    """Agora RTC token model."""
    token: str
    channel_name: str
    uid: int
    expires_in: int  # seconds

