from __future__ import annotations
import uuid
from collections.abc import AsyncIterator
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from litestar.di import Provide
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ChatMessage, ChatSession, SessionDocument, Submission, User

class UserRepo(SQLAlchemyAsyncRepository[User]):
    model_type = User

class ChatSessionRepo(SQLAlchemyAsyncRepository[ChatSession]):
    model_type = ChatSession

    async def get_owned_or_none(self, session_id: uuid.UUID, owner_id: uuid.UUID) -> ChatSession | None:
        chat_session = await self.get_one_or_none(id=session_id, owner_id=owner_id)
        return chat_session

class SubmissionRepo(SQLAlchemyAsyncRepository[Submission]):
    model_type = Submission

    async def get_latest_for_session(self, chat_session_id: uuid.UUID) -> Submission | None:
        statement = select(Submission)
        statement = statement.where(Submission.chat_session_id == chat_session_id)
        statement = statement.order_by(Submission.created_at.desc())
        statement = statement.limit(1)
        result = await self.session.execute(statement)
        submission = result.scalar_one_or_none()
        return submission

class SessionDocumentRepo(SQLAlchemyAsyncRepository[SessionDocument]):
    model_type = SessionDocument

    async def get_latest_for_session(self, chat_session_id: uuid.UUID) -> SessionDocument | None:
        statement = select(SessionDocument)
        statement = statement.where(SessionDocument.chat_session_id == chat_session_id)
        statement = statement.order_by(SessionDocument.created_at.desc())
        statement = statement.limit(1)
        result = await self.session.execute(statement)
        document = result.scalar_one_or_none()
        return document

class ChatMessageRepo(SQLAlchemyAsyncRepository[ChatMessage]):
    model_type = ChatMessage

async def provide_user_repo(db_session: AsyncSession) -> AsyncIterator[UserRepo]:
    repo = UserRepo(session=db_session)
    yield repo

async def provide_chat_session_repo(db_session: AsyncSession) -> AsyncIterator[ChatSessionRepo]:
    repo = ChatSessionRepo(session=db_session)
    yield repo

async def provide_submission_repo(db_session: AsyncSession) -> AsyncIterator[SubmissionRepo]:
    repo = SubmissionRepo(session=db_session)
    yield repo

async def provide_session_document_repo(db_session: AsyncSession) -> AsyncIterator[SessionDocumentRepo]:
    repo = SessionDocumentRepo(session=db_session)
    yield repo

async def provide_chat_message_repo(db_session: AsyncSession) -> AsyncIterator[ChatMessageRepo]:
    repo = ChatMessageRepo(session=db_session)
    yield repo
provide_user_repo_dep = Provide(provide_user_repo)
provide_chat_session_repo_dep = Provide(provide_chat_session_repo)
provide_submission_repo_dep = Provide(provide_submission_repo)
provide_session_document_repo_dep = Provide(provide_session_document_repo)
provide_chat_message_repo_dep = Provide(provide_chat_message_repo)
