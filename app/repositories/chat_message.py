from __future__ import annotations

import uuid

from advanced_alchemy.filters import LimitOffset
from advanced_alchemy.repository import SQLAlchemyAsyncRepository

from app.db.models import ChatMessage


class ChatMessageRepo(SQLAlchemyAsyncRepository[ChatMessage]):
    model_type = ChatMessage

    async def get_recent_for_session(
        self,
        chat_session_id: uuid.UUID,
        limit: int = 50,
    ) -> list[ChatMessage]:
        limit_offset = LimitOffset(limit=limit, offset=0)
        results = await self.get_many(limit_offset, chat_session_id=chat_session_id)
        messages: list[ChatMessage] = []
        for message in results:
            messages.append(message)
        return messages
