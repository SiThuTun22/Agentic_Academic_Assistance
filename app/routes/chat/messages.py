from __future__ import annotations

import uuid

from advanced_alchemy.filters import LimitOffset
from litestar import Request, Router, get, post
from litestar.params import Parameter
from litestar.security.jwt import Token

from app.ai.errors import LlmUnavailableError
from app.db.models import User
from app.repositories import (
    ChatMessageRepo,
    ChatSessionRepo,
    SessionDocumentRepo,
    provide_chat_message_repo_dep,
    provide_chat_session_repo_dep,
    provide_session_document_repo_dep,
)
from app.routes.mappers import raise_llm_unavailable, require_owned_session, to_message_read, to_session_read
from app.schemas import ChatMessageCreate, ChatMessageExchangeRead, ChatMessageRead
from app.services.chat.messages import send_message_exchange


@get('/{session_id:uuid}/messages')
async def list_messages(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    chat_message_repo: ChatMessageRepo,
    session_id: uuid.UUID,
    limit: int = Parameter(default=50, ge=1, le=200),
    offset: int = Parameter(default=0, ge=0),
) -> list[ChatMessageRead]:
    user = request.user
    await require_owned_session(chat_session_repo, session_id, user.id)
    limit_offset = LimitOffset(limit=limit, offset=offset)
    results = await chat_message_repo.get_many(limit_offset, chat_session_id=session_id)
    messages: list[ChatMessageRead] = []
    for message in results:
        message_read = to_message_read(message)
        messages.append(message_read)
    return messages


@post('/{session_id:uuid}/messages', status_code=201)
async def create_message(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    chat_message_repo: ChatMessageRepo,
    session_document_repo: SessionDocumentRepo,
    session_id: uuid.UUID,
    data: ChatMessageCreate,
) -> ChatMessageExchangeRead:
    user = request.user
    chat_session = await require_owned_session(chat_session_repo, session_id, user.id)

    try:
        exchange_result = await send_message_exchange(
            chat_session,
            session_id,
            data.content,
            chat_message_repo,
            session_document_repo,
            chat_session_repo,
        )
    except LlmUnavailableError as error:
        raise_llm_unavailable(error)

    user_read = to_message_read(exchange_result.user_message)
    assistant_read = to_message_read(exchange_result.assistant_message)
    session_read = to_session_read(exchange_result.chat_session)
    exchange = ChatMessageExchangeRead(
        user_message=user_read,
        assistant_message=assistant_read,
        session=session_read,
    )
    return exchange


messages_router = Router(
    path='/api/chat-sessions',
    route_handlers=[list_messages, create_message],
    dependencies={
        'chat_session_repo': provide_chat_session_repo_dep,
        'chat_message_repo': provide_chat_message_repo_dep,
        'session_document_repo': provide_session_document_repo_dep,
    },
)
