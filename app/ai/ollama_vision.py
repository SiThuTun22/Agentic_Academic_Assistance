from __future__ import annotations

import base64
import logging

import httpx

from app.ai.errors import LlmUnavailableError
from app.lib.config import (
    get_ollama_chat_endpoint,
    get_ollama_vision_max_tokens,
    get_ollama_vision_model,
    get_ollama_vision_num_ctx,
    get_ollama_vision_timeout_seconds,
)
from app.services.documents.image_prepare import (
    prepare_image_bytes_for_vision,
    prepare_image_bytes_for_vision_small,
)

_VISION_EXTRACT_PROMPT = (
    'You are a careful academic document and image analyst. '
    'Extract ALL useful information from the provided image(s) in detail. '
    'If this is a graph, chart, diagram, or plot, describe: chart type; axes and units; '
    'important points, curves, or bars; whether curves open upward or downward; '
    'trends, intercepts, peaks, and relationships; and any labels, legends, or titles. '
    'If this is text or mixed content, transcribe important text and explain figures. '
    'If something is unclear or unreadable, say so explicitly. '
    'Write a detailed plain-text description only. Do not tutor the student.'
)

_VISION_DOWN = 'Ollama vision request failed. Start Ollama and pull a vision model.'

logger = logging.getLogger(__name__)


def _encode_image(image_bytes: bytes) -> str:
    encoded = base64.b64encode(image_bytes)
    encoded_text = encoded.decode('ascii')
    return encoded_text


def _text_from_ollama_body(body: object) -> str:
    if not isinstance(body, dict):
        raise LlmUnavailableError('Ollama returned an invalid vision response.')

    message = body.get('message')
    if not isinstance(message, dict):
        raise LlmUnavailableError('Ollama returned an invalid vision message.')

    content = message.get('content')
    if not isinstance(content, str):
        raise LlmUnavailableError('Ollama returned an invalid vision description.')

    trimmed = content.strip()
    if len(trimmed) == 0:
        raise LlmUnavailableError('Ollama returned an empty vision description.')
    return trimmed


async def _describe_single_image(
    client: httpx.AsyncClient,
    endpoint: str,
    model: str,
    image_bytes: bytes,
    max_tokens: int,
) -> str:
    prepared_bytes = prepare_image_bytes_for_vision(image_bytes)

    try:
        description = await _post_vision_request(
            client,
            endpoint,
            model,
            prepared_bytes,
            max_tokens,
        )
    except LlmUnavailableError as error:
        error_text = str(error)
        if 'exceed_context_size' not in error_text and 'context size' not in error_text:
            raise
        logger.warning('Vision image exceeded context size; retrying with smaller image.')
        smaller_bytes = prepare_image_bytes_for_vision_small(image_bytes)
        description = await _post_vision_request(
            client,
            endpoint,
            model,
            smaller_bytes,
            max_tokens,
        )

    return description


async def _post_vision_request(
    client: httpx.AsyncClient,
    endpoint: str,
    model: str,
    image_bytes: bytes,
    max_tokens: int,
) -> str:
    encoded_text = _encode_image(image_bytes)

    images: list[str] = []
    images.append(encoded_text)

    user_message: dict[str, object] = {}
    user_message['role'] = 'user'
    user_message['content'] = _VISION_EXTRACT_PROMPT
    user_message['images'] = images

    options: dict[str, int] = {}
    options['num_predict'] = max_tokens
    num_ctx = get_ollama_vision_num_ctx()
    options['num_ctx'] = num_ctx

    payload: dict[str, object] = {}
    payload['model'] = model
    payload['messages'] = [user_message]
    payload['stream'] = False
    payload['options'] = options

    headers: dict[str, str] = {}
    headers['Content-Type'] = 'application/json'

    response = await client.post(endpoint, headers=headers, json=payload)

    if response.status_code >= 400:
        detail = response.text
        raise LlmUnavailableError(f'{_VISION_DOWN} ({response.status_code}): {detail}')

    try:
        body = response.json()
    except ValueError as error:
        raise LlmUnavailableError('Ollama returned an invalid vision response.') from error

    description = _text_from_ollama_body(body)
    return description


async def extract_vision_description(image_bytes_list: list[bytes]) -> str:
    if len(image_bytes_list) == 0:
        return ''

    model = get_ollama_vision_model()
    endpoint = get_ollama_chat_endpoint()

    timeout_seconds = get_ollama_vision_timeout_seconds()
    timeout_value = httpx.Timeout(float(timeout_seconds), connect=10.0)
    max_tokens = get_ollama_vision_max_tokens()

    descriptions: list[str] = []

    try:
        async with httpx.AsyncClient(timeout=timeout_value) as client:
            image_index = 0
            while image_index < len(image_bytes_list):
                image_bytes = image_bytes_list[image_index]
                if len(image_bytes) > 0:
                    try:
                        description = await _describe_single_image(
                            client,
                            endpoint,
                            model,
                            image_bytes,
                            max_tokens,
                        )
                        descriptions.append(description)
                    except LlmUnavailableError as error:
                        page_number = image_index + 1
                        logger.warning(
                            'Vision skipped for image %s of %s: %s',
                            page_number,
                            len(image_bytes_list),
                            error,
                        )
                image_index = image_index + 1
    except httpx.TimeoutException as error:
        if len(descriptions) > 0:
            logger.warning(
                'Vision timed out after %ss; using %s partial description(s).',
                timeout_seconds,
                len(descriptions),
            )
        else:
            timeout_message = (
                f'Ollama vision timed out after {timeout_seconds}s. '
                'Increase OLLAMA_VISION_TIMEOUT_SECONDS or preload the model with: '
                f'ollama run {model}'
            )
            raise LlmUnavailableError(timeout_message) from error
    except (httpx.ConnectError, OSError) as error:
        if len(descriptions) > 0:
            logger.warning(
                'Vision connection failed; using %s partial description(s).',
                len(descriptions),
            )
        else:
            raise LlmUnavailableError(_VISION_DOWN) from error

    if len(descriptions) == 0:
        return ''

    joined = '\n\n'.join(descriptions)
    return joined
