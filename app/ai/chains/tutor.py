from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser

from app.ai.errors import LlmUnavailableError
from app.ai.llm import get_chat_model, invoke_ollama
from app.ai.prompts import TUTOR_PROMPT, TUTOR_SYSTEM, TUTOR_SYSTEM_STRICT
from app.models import ChatMessage, ChatSession, MessageRole, TutorTone


def _format_history(history: list[ChatMessage]) -> str:
    if len(history) == 0:
        return '(none)'

    lines: list[str] = []
    for message in history:
        if message.role == MessageRole.USER:
            role_label = 'Student'
        else:
            role_label = 'Tutor'
        line = f'{role_label}: {message.content}'
        lines.append(line)

    joined = '\n'.join(lines)
    return joined


def _format_document_context(document_context: str | None) -> str:
    if document_context is None:
        return '(none)'
    trimmed = document_context.strip()
    if len(trimmed) == 0:
        return '(none)'
    return trimmed


def _system_prompt_for_tone(tutor_tone: TutorTone | str) -> str:
    tone_value = str(tutor_tone)
    if tone_value == TutorTone.STRICT_ACADEMIC.value:
        return TUTOR_SYSTEM_STRICT
    return TUTOR_SYSTEM


async def generate_tutor_reply(
    chat_session: ChatSession,
    history: list[ChatMessage],
    user_content: str,
    document_context: str | None = None,
) -> str:
    chat_model = get_chat_model()
    output_parser = StrOutputParser()
    tutor_chain = TUTOR_PROMPT | chat_model | output_parser

    payload = {
        'system_prompt': _system_prompt_for_tone(chat_session.tutor_tone),
        'document_context': _format_document_context(document_context),
        'message_history': _format_history(history),
        'user_content': user_content,
    }

    reply = await invoke_ollama(tutor_chain, payload)

    if not isinstance(reply, str):
        raise LlmUnavailableError('Ollama returned an unexpected tutor response.')

    trimmed = reply.strip()
    if len(trimmed) == 0:
        raise LlmUnavailableError('Ollama returned an empty tutor response.')

    return trimmed
