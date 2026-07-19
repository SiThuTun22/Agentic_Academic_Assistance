from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.ai.tutor import generate_tutor_reply
from app.db.models import ChatMessage, ChatSession, MessageRole
from app.repositories.chat_message import ChatMessageRepo
from app.repositories.chat_session import ChatSessionRepo
from app.repositories.session_document import SessionDocumentRepo
from app.services.chat.session_title import maybe_autotitle_session
from app.services.documents.context import build_document_context


@dataclass
class MessageExchangeResult:
    user_message: ChatMessage
    assistant_message: ChatMessage
    chat_session: ChatSession


async def send_message_exchange(
    chat_session: ChatSession,
    session_id: uuid.UUID,
    content: str,
    chat_message_repo: ChatMessageRepo,
    session_document_repo: SessionDocumentRepo,
    chat_session_repo: ChatSessionRepo,
) -> MessageExchangeResult:
    history = await chat_message_repo.get_recent_for_session(session_id)

    user_message = ChatMessage(chat_session_id=session_id, role=MessageRole.USER, content=content)
    created_user = await chat_message_repo.add(user_message)

    latest_document = await session_document_repo.get_latest_for_session(session_id)
    document_context = None
    if latest_document is not None:
        document_context = build_document_context(
            latest_document.extracted_text,
            latest_document.vision_description,
        )
        if len(document_context) == 0:
            document_context = None

    tutor_text = await generate_tutor_reply(chat_session, history, content, document_context)

    assistant_message = ChatMessage(chat_session_id=session_id, role=MessageRole.ASSISTANT, content=tutor_text)
    created_assistant = await chat_message_repo.add(assistant_message)

    updated_session = await maybe_autotitle_session(
        chat_session,
        content,
        chat_session_repo,
    )

    result = MessageExchangeResult(
        user_message=created_user,
        assistant_message=created_assistant,
        chat_session=updated_session,
    )
    return result
