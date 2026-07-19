from __future__ import annotations

import uuid

from pydantic import BaseModel

from app.db.enums import MessageRole
from app.schemas.chat_session import ChatSessionRead


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageRead(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    role: MessageRole
    content: str


class ChatMessageExchangeRead(BaseModel):
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead
    session: ChatSessionRead
