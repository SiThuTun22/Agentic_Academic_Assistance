from __future__ import annotations

import base64
import logging

import httpx

from app.ai.errors import LlmUnavailableError
from app.lib.config import (
    get_groq_api_key,
    get_groq_chat_completions_endpoint,
    get_groq_vision_max_tokens,
    get_groq_vision_model,
    get_groq_vision_timeout_seconds,
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

_VISION_DOWN = 'Groq vision request failed. Check GROQ_API_KEY and GROQ_VISION_MODEL.'

logger = logging.getLogger(__name__)


def _encode_image(image_bytes: bytes) -> str:
    encoded = base64.b64encode(image_bytes)
    encoded_text = encoded.decode('ascii')
    return encoded_text


def _text_from_groq_body(body: object) -> str:
    if not isinstance(body, dict):
        raise LlmUnavailableError('Groq returned an invalid vision response.')

    choices = body.get('choices')
    if not isinstance(choices, list) or len(choices) == 0:
        raise LlmUnavailableError('Groq returned an invalid vision response.')

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise LlmUnavailableError('Groq returned an invalid vision response.')

    message = first_choice.get('message')
    if not isinstance(message, dict):
        raise LlmUnavailableError('Groq returned an invalid vision message.')

    content = message.get('content')
    if not isinstance(content, str):
        raise LlmUnavailableError('Groq returned an invalid vision description.')

    trimmed = content.strip()
    if len(trimmed) == 0:
        raise LlmUnavailableError('Groq returned an empty vision description.')
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
        context_too_large = 'exceed_context_size' in error_text or 'context size' in error_text
        context_too_large = context_too_large or 'context_length' in error_text
        if not context_too_large:
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
    data_url = f'data:image/jpeg;base64,{encoded_text}'

    text_part: dict[str, str] = {}
    text_part['type'] = 'text'
    text_part['text'] = _VISION_EXTRACT_PROMPT

    image_url: dict[str, str] = {}
    image_url['url'] = data_url
    image_part: dict[str, object] = {}
    image_part['type'] = 'image_url'
    image_part['image_url'] = image_url

    content_parts: list[object] = []
    content_parts.append(text_part)
    content_parts.append(image_part)

    user_message: dict[str, object] = {}
    user_message['role'] = 'user'
    user_message['content'] = content_parts

    payload: dict[str, object] = {}
    payload['model'] = model
    payload['messages'] = [user_message]
    payload['max_tokens'] = max_tokens
    payload['temperature'] = 0

    api_key = get_groq_api_key()
    if len(api_key) == 0:
        raise LlmUnavailableError('GROQ_API_KEY is not set.')

    headers: dict[str, str] = {}
    headers['Content-Type'] = 'application/json'
    headers['Authorization'] = f'Bearer {api_key}'

    response = await client.post(endpoint, headers=headers, json=payload)

    if response.status_code >= 400:
        detail = response.text
        raise LlmUnavailableError(f'{_VISION_DOWN} ({response.status_code}): {detail}')

    try:
        body = response.json()
    except ValueError as error:
        raise LlmUnavailableError('Groq returned an invalid vision response.') from error

    description = _text_from_groq_body(body)
    return description


async def _describe_image_with_retry(
    client: httpx.AsyncClient,
    endpoint: str,
    model: str,
    image_bytes: bytes,
    max_tokens: int,
) -> str:
    try:
        description = await _describe_single_image(
            client,
            endpoint,
            model,
            image_bytes,
            max_tokens,
        )
        return description
    except (httpx.ConnectError, OSError) as error:
        logger.warning('Vision connection failed; retrying once: %s', error)

    try:
        description = await _describe_single_image(
            client,
            endpoint,
            model,
            image_bytes,
            max_tokens,
        )
        return description
    except (httpx.ConnectError, OSError) as error:
        cause = str(error)
        message = f'{_VISION_DOWN} {cause}'
        raise LlmUnavailableError(message) from error


async def extract_vision_description(image_bytes_list: list[bytes]) -> str:
    if len(image_bytes_list) == 0:
        return ''

    model = get_groq_vision_model()
    endpoint = get_groq_chat_completions_endpoint()

    timeout_seconds = get_groq_vision_timeout_seconds()
    timeout_value = httpx.Timeout(float(timeout_seconds), connect=10.0)
    max_tokens = get_groq_vision_max_tokens()

    descriptions: list[str] = []
    last_error: LlmUnavailableError | None = None

    try:
        async with httpx.AsyncClient(timeout=timeout_value) as client:
            image_index = 0
            while image_index < len(image_bytes_list):
                image_bytes = image_bytes_list[image_index]
                if len(image_bytes) > 0:
                    try:
                        description = await _describe_image_with_retry(
                            client,
                            endpoint,
                            model,
                            image_bytes,
                            max_tokens,
                        )
                        descriptions.append(description)
                    except LlmUnavailableError as error:
                        last_error = error
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
                f'Groq vision timed out after {timeout_seconds}s. '
                'Increase GROQ_VISION_TIMEOUT_SECONDS.'
            )
            raise LlmUnavailableError(timeout_message) from error
    except (httpx.ConnectError, OSError) as error:
        if len(descriptions) > 0:
            logger.warning(
                'Vision connection failed; using %s partial description(s).',
                len(descriptions),
            )
        else:
            cause = str(error)
            message = f'{_VISION_DOWN} {cause}'
            raise LlmUnavailableError(message) from error

    if len(descriptions) == 0:
        if last_error is not None:
            raise last_error
        return ''

    joined = '\n\n'.join(descriptions)
    return joined
