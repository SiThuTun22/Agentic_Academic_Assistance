from __future__ import annotations
import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TutorTone(enum.StrEnum):
    SOCRATIC = 'socratic'
    STRICT_ACADEMIC = 'strict_academic'

class TutorAvatar(enum.StrEnum):
    MALE = 'male'
    FEMALE = 'female'

class ChatSessionStatus(enum.StrEnum):
    ACTIVE = 'active'
    ARCHIVED = 'archived'

class MessageRole(enum.StrEnum):
    USER = 'user'
    ASSISTANT = 'assistant'

class User(Base):
    __tablename__ = 'users'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500))
    tutor_tone: Mapped[TutorTone] = mapped_column(String(50), default=TutorTone.SOCRATIC)
    tutor_avatar: Mapped[TutorAvatar] = mapped_column(String(50), default=TutorAvatar.FEMALE)
    status: Mapped[ChatSessionStatus] = mapped_column(String(50), default=ChatSessionStatus.ACTIVE)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey('users.id', ondelete='CASCADE'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Submission(Base):
    __tablename__ = 'submissions'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chat_session_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey('chat_sessions.id', ondelete='CASCADE'))
    question_text: Mapped[str] = mapped_column(Text)
    reference_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chat_session_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey('chat_sessions.id', ondelete='CASCADE'))
    role: Mapped[MessageRole] = mapped_column(String(50), default=MessageRole.USER)
    content: Mapped[str] = mapped_column(Text)
    keyword_context: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
