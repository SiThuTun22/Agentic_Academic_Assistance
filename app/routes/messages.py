from __future__ import annotations
import uuid
from advanced_alchemy.filters import LimitOffset
from litestar import Request, Router, get, post
from litestar.exceptions import NotFoundException, ServiceUnavailableException
from litestar.params import Parameter
from litestar.security.jwt import Token
from app.ai.errors import LlmUnavailableError
from app.ai.chains.tutor import generate_tutor_reply
from app.models import ChatMessage, MessageRole, User
from app.repos import (
    ChatMessageRepo,
    ChatSessionRepo,
    SessionDocumentRepo,
    provide_chat_message_repo_dep,
    provide_chat_session_repo_dep,
    provide_session_document_repo_dep,
)
from app.schemas import ChatMessageCreate, ChatMessageExchangeRead, ChatMessageRead
from app.services.document_processing import truncate_document_context

def _to_message_read(message: ChatMessage) -> ChatMessageRead:
    message_read = ChatMessageRead(
        id=message.id,
        chat_session_id=message.chat_session_id,
        role=message.role,
        content=message.content,
        keyword_context=message.keyword_context,
    )
    return message_read

@get('/{session_id:uuid}/messages')
async def list_messages(request: Request[User, Token, None], chat_session_repo: ChatSessionRepo, chat_message_repo: ChatMessageRepo, session_id: uuid.UUID, limit: int=Parameter(default=50, ge=1, le=200), offset: int=Parameter(default=0, ge=0)) -> list[ChatMessageRead]:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')
    limit_offset = LimitOffset(limit=limit, offset=offset)
    results = await chat_message_repo.get_many(limit_offset, chat_session_id=session_id)
    messages: list[ChatMessageRead] = []
    for message in results:
        message_read = _to_message_read(message)
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
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')
    limit_offset = LimitOffset(limit=50, offset=0)
    history_results = await chat_message_repo.get_many(limit_offset, chat_session_id=session_id)
    history: list[ChatMessage] = []
    for message in history_results:
        history.append(message)
    user_message = ChatMessage(chat_session_id=session_id, role=MessageRole.USER, content=data.content, keyword_context=None)
    created_user = await chat_message_repo.add(user_message)

    latest_document = await session_document_repo.get_latest_for_session(session_id)
    document_context = None
    if latest_document is not None:
        document_context = truncate_document_context(latest_document.extracted_text)

    try:
        tutor_text = await generate_tutor_reply(chat_session, history, data.content, document_context)
    except LlmUnavailableError as error:
        raise ServiceUnavailableException(detail=str(error)) from error
    assistant_message = ChatMessage(chat_session_id=session_id, role=MessageRole.ASSISTANT, content=tutor_text, keyword_context=None)
    created_assistant = await chat_message_repo.add(assistant_message)
    user_read = _to_message_read(created_user)
    assistant_read = _to_message_read(created_assistant)
    exchange = ChatMessageExchangeRead(user_message=user_read, assistant_message=assistant_read)
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
