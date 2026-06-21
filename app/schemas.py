from __future__ import annotations
import uuid
from pydantic import BaseModel, EmailStr
from app.models import ChatSessionStatus, MessageRole, TutorAvatar, TutorTone

class HealthResponse(BaseModel):
    status: str
    version: str

class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'

class UserMe(BaseModel):
    id: uuid.UUID
    email: EmailStr
    display_name: str
    is_active: bool

class ChatSessionCreate(BaseModel):
    title: str
    tutor_tone: TutorTone = TutorTone.SOCRATIC
    tutor_avatar: TutorAvatar = TutorAvatar.FEMALE
    status: ChatSessionStatus = ChatSessionStatus.ACTIVE

class ChatSessionRead(BaseModel):
    id: uuid.UUID
    title: str
    tutor_tone: TutorTone
    tutor_avatar: TutorAvatar
    status: ChatSessionStatus
    owner_id: uuid.UUID

class SubmissionCreate(BaseModel):
    question_text: str
    reference_text: str | None = None

class SubmissionRead(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    question_text: str
    reference_text: str | None
    keywords: list[str]

class ChatMessageCreate(BaseModel):
    content: str
    keyword_context: str | None = None

class ChatMessageRead(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    role: MessageRole
    content: str
    keyword_context: str | None
