from __future__ import annotations

import httpx
from langchain_core.runnables import Runnable
from langchain_ollama import ChatOllama

from app.ai.errors import LlmUnavailableError
from app.lib.config import get_ollama_base_url, get_ollama_max_tokens, get_ollama_model, get_ollama_timeout_seconds

_OLLAMA_DOWN = 'Ollama is not reachable. Start Ollama and pull a model.'


def get_chat_model() -> ChatOllama:
    base_url = get_ollama_base_url()
    model = get_ollama_model()
    timeout_seconds = get_ollama_timeout_seconds()
    max_tokens = get_ollama_max_tokens()
    client_kwargs: dict[str, float] = {}
    client_kwargs['timeout'] = float(timeout_seconds)
    model_kwargs: dict[str, int] = {}
    model_kwargs['num_predict'] = max_tokens
    chat_model = ChatOllama(
        model=model,
        base_url=base_url,
        temperature=0,
        client_kwargs=client_kwargs,
        model_kwargs=model_kwargs,
    )
    return chat_model


async def invoke_ollama(runnable: Runnable, payload: dict[str, str]) -> object:
    timeout_seconds = get_ollama_timeout_seconds()
    try:
        result = await runnable.ainvoke(payload)
    except httpx.TimeoutException as error:
        timeout_message = (
            f'Ollama timed out after {timeout_seconds}s. Increase OLLAMA_TIMEOUT_SECONDS.'
        )
        raise LlmUnavailableError(timeout_message) from error
    except (httpx.ConnectError, ConnectionError, OSError) as error:
        raise LlmUnavailableError(_OLLAMA_DOWN) from error
    except Exception as error:
        message = str(error)
        if 'connection' in message.lower() or 'connect' in message.lower():
            raise LlmUnavailableError(_OLLAMA_DOWN) from error
        raise LlmUnavailableError(f'Ollama request failed: {message}') from error
    return result
