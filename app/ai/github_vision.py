from __future__ import annotations

import base64

import httpx

from app.ai.errors import LlmUnavailableError
from app.lib.config import (
    get_github_models_base_url,
    get_github_models_model,
    get_github_token,
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

_TOKEN_MISSING = (
    'GitHub Models token is not configured. Set GITHUB_TOKEN or GITHUB_MODELS_TOKEN in .env.'
)
_VISION_DOWN = 'GitHub Models vision request failed. Check your token and network.'


def _mime_for_image_bytes(image_bytes: bytes) -> str:
    if image_bytes.startswith(b'\x89PNG'):
        return 'image/png'
    if image_bytes.startswith(b'\xff\xd8'):
        return 'image/jpeg'
    if image_bytes.startswith(b'RIFF') and b'WEBP' in image_bytes[:16]:
        return 'image/webp'
    return 'image/png'


def _image_content_part(image_bytes: bytes) -> dict[str, object]:
    mime = _mime_for_image_bytes(image_bytes)
    encoded = base64.b64encode(image_bytes)
    encoded_text = encoded.decode('ascii')
    data_url = f'data:{mime};base64,{encoded_text}'
    image_url: dict[str, str] = {}
    image_url['url'] = data_url
    part: dict[str, object] = {}
    part['type'] = 'image_url'
    part['image_url'] = image_url
    return part


async def extract_vision_description(image_bytes_list: list[bytes]) -> str:
    if len(image_bytes_list) == 0:
        return ''

    token = get_github_token()
    if token is None:
        raise LlmUnavailableError(_TOKEN_MISSING)

    base_url = get_github_models_base_url()
    model = get_github_models_model()
    endpoint = f'{base_url.rstrip("/")}/chat/completions'

    content_parts: list[dict[str, object]] = []
    text_part: dict[str, object] = {}
    text_part['type'] = 'text'
    text_part['text'] = _VISION_EXTRACT_PROMPT
    content_parts.append(text_part)

    image_index = 0
    while image_index < len(image_bytes_list):
        image_bytes = image_bytes_list[image_index]
        if len(image_bytes) > 0:
            content_parts.append(_image_content_part(image_bytes))
        image_index = image_index + 1

    if len(content_parts) == 1:
        return ''

    user_message: dict[str, object] = {}
    user_message['role'] = 'user'
    user_message['content'] = content_parts

    payload: dict[str, object] = {}
    payload['model'] = model
    payload['messages'] = [user_message]
    payload['temperature'] = 0

    headers: dict[str, str] = {}
    headers['Authorization'] = f'Bearer {token}'
    headers['Content-Type'] = 'application/json'
    headers['Accept'] = 'application/json'

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
    except (httpx.ConnectError, httpx.TimeoutException, OSError) as error:
        raise LlmUnavailableError(_VISION_DOWN) from error

    if response.status_code >= 400:
        detail = response.text
        raise LlmUnavailableError(f'{_VISION_DOWN} ({response.status_code}): {detail}')

    body = response.json()
    choices = body.get('choices')
    if not isinstance(choices, list) or len(choices) == 0:
        raise LlmUnavailableError('GitHub Models returned no vision choices.')

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise LlmUnavailableError('GitHub Models returned an invalid vision choice.')

    message = first_choice.get('message')
    if not isinstance(message, dict):
        raise LlmUnavailableError('GitHub Models returned an invalid vision message.')

    content = message.get('content')
    if not isinstance(content, str):
        raise LlmUnavailableError('GitHub Models returned an empty vision description.')

    trimmed = content.strip()
    if len(trimmed) == 0:
        raise LlmUnavailableError('GitHub Models returned an empty vision description.')
    return trimmed
