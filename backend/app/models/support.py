from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.base import Base

class ChatStatus(str, enum.Enum):
    open = "open"
    closed = "closed"

class MessageSender(str, enum.Enum):
    user = "user"
    support = "support"

class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class SupportChat(Base):
    __tablename__ = "support_chats"

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(Enum(ChatStatus), default=ChatStatus.open)
    priority = Column(Enum(Priority), default=Priority.medium)
    assigned_to = Column(String(255), nullable=True)  # Admin name who is handling this ticket
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="support_chats")
    messages = relationship("SupportMessage", back_populates="chat", cascade="all, delete-orphan")

    @property
    def last_message(self) -> str:
        if self.messages:
            return self.messages[-1].message
        return ""

    @property
    def unread_count(self) -> int:
        """Count of unread support messages (for user view)"""
        return sum(1 for msg in self.messages if msg.sender == MessageSender.support and not msg.is_read)

    @property
    def user_unread_count(self) -> int:
        """Count of unread user messages (for admin view)"""
        return sum(1 for msg in self.messages if msg.sender == MessageSender.user and not msg.is_read)

class SupportMessage(Base):
    __tablename__ = "support_messages"

    id = Column(String(36), primary_key=True)
    chat_id = Column(String(36), ForeignKey("support_chats.id"), nullable=False)
    sender = Column(Enum(MessageSender), nullable=False)
    message = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)  # Cloudflare image URL
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    chat = relationship("SupportChat", back_populates="messages")
