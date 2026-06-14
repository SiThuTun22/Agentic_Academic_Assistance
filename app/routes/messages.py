"""Chat message routes (right column tutor thread)."""

from __future__ import annotations

import uuid

from advanced_alchemy.filters import LimitOffset
from litestar import Request, Router, get, post
from litestar.exceptions import NotFoundException
from litestar.params import Parameter
from litestar.security.jwt import Token

from app.models import ChatMessage, MessageRole, User
from app.repos import ChatMessageRepo, ChatSessionRepo, provide_chat_message_repo_dep, provide_chat_session_repo_dep
from app.schemas import ChatMessageCreate, ChatMessageRead


@get("/{session_id:uuid}/messages")
async def list_messages(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    chat_message_repo: ChatMessageRepo,
    session_id: uuid.UUID,
    limit: int = Parameter(default=50, ge=1, le=200),
    offset: int = Parameter(default=0, ge=0),
) -> list[ChatMessageRead]:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)

    if chat_session is None:
        raise NotFoundException(detail=f"Chat session {session_id} not found")

    limit_offset = LimitOffset(limit=limit, offset=offset)
    results = await chat_message_repo.get_many(limit_offset, chat_session_id=session_id)

    messages: list[ChatMessageRead] = []
    for message in results:
        message_read = ChatMessageRead(
            id=message.id,
            chat_session_id=message.chat_session_id,
            role=message.role,
            content=message.content,
            keyword_context=message.keyword_context,
        )
        messages.append(message_read)
    return messages


@post("/{session_id:uuid}/messages", status_code=201)
async def create_message(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    chat_message_repo: ChatMessageRepo,
    session_id: uuid.UUID,
    data: ChatMessageCreate,
) -> ChatMessageRead:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)

    if chat_session is None:
        raise NotFoundException(detail=f"Chat session {session_id} not found")

    message = ChatMessage(
        chat_session_id=session_id,
        role=MessageRole.USER,
        content=data.content,
        keyword_context=data.keyword_context,
    )
    created = await chat_message_repo.add(message)

    # TODO: Socratic tutor reply generation (right column)
    message_read = ChatMessageRead(
        id=created.id,
        chat_session_id=created.chat_session_id,
        role=created.role,
        content=created.content,
        keyword_context=created.keyword_context,
    )
    return message_read


messages_router = Router(
    path="/api/chat-sessions",
    route_handlers=[list_messages, create_message],
    dependencies={
        "chat_session_repo": provide_chat_session_repo_dep,
        "chat_message_repo": provide_chat_message_repo_dep,
    },
)
