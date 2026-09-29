from __future__ import annotations

import httpx
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI

from app.ai.errors import LlmUnavailableError
from app.lib.config import (
    get_groq_api_key,
    get_groq_base_url,
    get_groq_max_tokens,
    get_groq_model,
    get_groq_timeout_seconds,
)

_GROQ_DOWN = 'Groq is not reachable. Check GROQ_API_KEY and GROQ_BASE_URL.'


def get_chat_model() -> ChatOpenAI:
    api_key = get_groq_api_key()
    if len(api_key) == 0:
        raise LlmUnavailableError('GROQ_API_KEY is not set.')

    base_url = get_groq_base_url()
    model = get_groq_model()
    timeout_seconds = get_groq_timeout_seconds()
    max_tokens = get_groq_max_tokens()
    extra_body: dict[str, str] = {}
    extra_body['reasoning_effort'] = 'low'
    timeout_value = float(timeout_seconds)
    chat_model = ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=0,
        max_tokens=max_tokens,
        timeout=timeout_value,
        extra_body=extra_body,
    )
    return chat_model


async def invoke_chat(runnable: Runnable, payload: dict[str, str]) -> object:
    timeout_seconds = get_groq_timeout_seconds()
    try:
        result = await runnable.ainvoke(payload)
    except httpx.TimeoutException as error:
        timeout_message = (
            f'Groq timed out after {timeout_seconds}s. Increase GROQ_TIMEOUT_SECONDS.'
        )
        raise LlmUnavailableError(timeout_message) from error
    except (httpx.ConnectError, ConnectionError, OSError) as error:
        raise LlmUnavailableError(_GROQ_DOWN) from error
    except Exception as error:
        message = str(error)
        if 'connection' in message.lower() or 'connect' in message.lower():
            raise LlmUnavailableError(_GROQ_DOWN) from error
        raise LlmUnavailableError(f'Groq request failed: {message}') from error
    return result
