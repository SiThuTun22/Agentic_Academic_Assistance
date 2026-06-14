"""Chat session routes (left sidebar)."""

from __future__ import annotations

import uuid

from advanced_alchemy.filters import LimitOffset
from litestar import Request, Router, get, post
from litestar.exceptions import NotFoundException
from litestar.params import Parameter
from litestar.security.jwt import Token

from app.models import ChatSession, User
from app.repos import ChatSessionRepo, provide_chat_session_repo_dep
from app.schemas import ChatSessionCreate, ChatSessionRead


@get("/")
async def list_chat_sessions(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    limit: int = Parameter(default=20, ge=1, le=100),
    offset: int = Parameter(default=0, ge=0),
) -> list[ChatSessionRead]:
    user = request.user
    limit_offset = LimitOffset(limit=limit, offset=offset)
    results = await chat_session_repo.get_many(limit_offset, owner_id=user.id)

    sessions: list[ChatSessionRead] = []
    for chat_session in results:
        session_read = ChatSessionRead(
            id=chat_session.id,
            title=chat_session.title,
            tutor_tone=chat_session.tutor_tone,
            tutor_avatar=chat_session.tutor_avatar,
            status=chat_session.status,
            owner_id=chat_session.owner_id,
        )
        sessions.append(session_read)
    return sessions


@get("/{session_id:uuid}")
async def get_chat_session(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    session_id: uuid.UUID,
) -> ChatSessionRead:
    user = request.user
    chat_session = await chat_session_repo.get_one_or_none(id=session_id, owner_id=user.id)

    if chat_session is None:
        raise NotFoundException(detail=f"Chat session {session_id} not found")

    session_read = ChatSessionRead(
        id=chat_session.id,
        title=chat_session.title,
        tutor_tone=chat_session.tutor_tone,
        tutor_avatar=chat_session.tutor_avatar,
        status=chat_session.status,
        owner_id=chat_session.owner_id,
    )
    return session_read


@post("/", status_code=201)
async def create_chat_session(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    data: ChatSessionCreate,
) -> ChatSessionRead:
    user = request.user
    chat_session = ChatSession(
        title=data.title,
        tutor_tone=data.tutor_tone,
        tutor_avatar=data.tutor_avatar,
        status=data.status,
        owner_id=user.id,
    )
    created = await chat_session_repo.add(chat_session)

    session_read = ChatSessionRead(
        id=created.id,
        title=created.title,
        tutor_tone=created.tutor_tone,
        tutor_avatar=created.tutor_avatar,
        status=created.status,
        owner_id=created.owner_id,
    )
    return session_read


chat_sessions_router = Router(
    path="/api/chat-sessions",
    route_handlers=[list_chat_sessions, get_chat_session, create_chat_session],
    dependencies={"chat_session_repo": provide_chat_session_repo_dep},
)
