from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.ai.errors import LlmUnavailableError
from app.ai.llm import get_chat_model, invoke_ollama

DEFAULT_SESSION_TITLE = 'New chat'
_TITLE_SOURCE_MAX_CHARS = 800
_TITLE_MAX_CHARS = 80

_TITLE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            'You invent short study-session titles. '
            'Reply with a title of 3 to 6 English words only. '
            'No quotes, no trailing punctuation, no explanation.',
        ),
        (
            'human',
            'Student content:\n{source_text}\n\nTitle:',
        ),
    ]
)


def _truncate_source(source_text: str) -> str:
    trimmed = source_text.strip()
    if len(trimmed) <= _TITLE_SOURCE_MAX_CHARS:
        return trimmed
    truncated = trimmed[:_TITLE_SOURCE_MAX_CHARS]
    return truncated


def fallback_session_title(source_text: str) -> str:
    trimmed = source_text.strip()
    if len(trimmed) == 0:
        return DEFAULT_SESSION_TITLE

    first_line = trimmed.splitlines()[0]
    first_line = first_line.strip()
    if first_line.lower().startswith('uploaded "'):
        without_prefix = first_line[len('uploaded "') :]
        if without_prefix.endswith('"'):
            without_prefix = without_prefix[:-1]
        first_line = without_prefix.strip()

    if len(first_line) == 0:
        return DEFAULT_SESSION_TITLE

    if len(first_line) <= _TITLE_MAX_CHARS:
        return first_line

    shortened = first_line[:_TITLE_MAX_CHARS].rstrip()
    return shortened


def _clean_generated_title(raw_title: str) -> str:
    cleaned = raw_title.strip()
    cleaned = cleaned.strip('"\'')
    cleaned = cleaned.strip()
    if cleaned.endswith('.'):
        cleaned = cleaned[:-1]
        cleaned = cleaned.strip()
    if len(cleaned) == 0:
        return DEFAULT_SESSION_TITLE
    if len(cleaned) > _TITLE_MAX_CHARS:
        cleaned = cleaned[:_TITLE_MAX_CHARS].rstrip()
    return cleaned


async def generate_session_title(source_text: str) -> str:
    truncated_source = _truncate_source(source_text)
    if len(truncated_source) == 0:
        return DEFAULT_SESSION_TITLE

    chat_model = get_chat_model()
    output_parser = StrOutputParser()
    title_chain = _TITLE_PROMPT | chat_model | output_parser

    payload = {
        'source_text': truncated_source,
    }

    try:
        reply = await invoke_ollama(title_chain, payload)
    except LlmUnavailableError:
        fallback = fallback_session_title(truncated_source)
        return fallback

    if not isinstance(reply, str):
        fallback = fallback_session_title(truncated_source)
        return fallback

    cleaned = _clean_generated_title(reply)
    if cleaned == DEFAULT_SESSION_TITLE:
        fallback = fallback_session_title(truncated_source)
        return fallback
    return cleaned
