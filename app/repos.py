from __future__ import annotations
import uuid
from collections.abc import AsyncIterator
from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from litestar.di import Provide
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ChatMessage, ChatSession, Submission, User

class UserRepo(SQLAlchemyAsyncRepository[User]):
    model_type = User

class ChatSessionRepo(SQLAlchemyAsyncRepository[ChatSession]):
    model_type = ChatSession

    async def get_owned_or_none(self, session_id: uuid.UUID, owner_id: uuid.UUID) -> ChatSession | None:
        chat_session = await self.get_one_or_none(id=session_id, owner_id=owner_id)
        return chat_session

class SubmissionRepo(SQLAlchemyAsyncRepository[Submission]):
    model_type = Submission

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

async def provide_chat_message_repo(db_session: AsyncSession) -> AsyncIterator[ChatMessageRepo]:
    repo = ChatMessageRepo(session=db_session)
    yield repo
provide_user_repo_dep = Provide(provide_user_repo)
provide_chat_session_repo_dep = Provide(provide_chat_session_repo)
provide_submission_repo_dep = Provide(provide_submission_repo)
provide_chat_message_repo_dep = Provide(provide_chat_message_repo)
