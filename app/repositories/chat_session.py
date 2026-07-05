from __future__ import annotations

import uuid

from advanced_alchemy.repository import SQLAlchemyAsyncRepository

from app.db.models import ChatSession


class ChatSessionRepo(SQLAlchemyAsyncRepository[ChatSession]):
    model_type = ChatSession

    async def get_owned_or_none(self, session_id: uuid.UUID, owner_id: uuid.UUID) -> ChatSession | None:
        chat_session = await self.get_one_or_none(id=session_id, owner_id=owner_id)
        return chat_session
