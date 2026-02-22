from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum

class ChatStatus(str, Enum):
    open = "open"
    closed = "closed"

class MessageSender(str, Enum):
    user = "user"
    support = "support"

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class SupportMessageBase(BaseModel):
    message: str
    image_url: Optional[str] = None

class SupportMessageCreate(SupportMessageBase):
    pass

class SupportMessage(SupportMessageBase):
    id: str
    chat_id: str
    sender: MessageSender
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SupportChatBase(BaseModel):
    subject: str

class SupportChatCreate(SupportChatBase):
    message: str

class SupportChat(SupportChatBase):
    id: str
    user_id: int
    status: ChatStatus
    priority: Priority
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_message: str
    unread_count: int
    user_unread_count: int
    messages: List[SupportMessage]

    class Config:
        from_attributes = True

class SupportChatSummary(BaseModel):
    id: str
    subject: str
    status: ChatStatus
    priority: Priority
    created_at: datetime
    updated_at: datetime
    last_message: str
    unread_count: int

    class Config:
        from_attributes = True