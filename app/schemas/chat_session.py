from __future__ import annotations

import uuid

from pydantic import BaseModel

from app.ai.session_title import DEFAULT_SESSION_TITLE
from app.db.enums import ChatSessionStatus, TutorAvatar, TutorTone


class ChatSessionCreate(BaseModel):
    title: str = DEFAULT_SESSION_TITLE
    tutor_tone: TutorTone = TutorTone.SOCRATIC
    tutor_avatar: TutorAvatar = TutorAvatar.FEMALE
    status: ChatSessionStatus = ChatSessionStatus.ACTIVE


class ChatSessionUpdate(BaseModel):
    tutor_tone: TutorTone | None = None
    tutor_avatar: TutorAvatar | None = None


class ChatSessionRead(BaseModel):
    id: uuid.UUID
    title: str
    tutor_tone: TutorTone
    tutor_avatar: TutorAvatar
    status: ChatSessionStatus
    owner_id: uuid.UUID
