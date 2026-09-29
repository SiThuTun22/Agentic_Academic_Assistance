from __future__ import annotations

import os
from pathlib import Path

from advanced_alchemy.config import AlembicAsyncConfig, AsyncSessionConfig
from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig
from dotenv import load_dotenv

DEFAULT_DATABASE_URL = 'postgresql+asyncpg://aaa:aaa@localhost:5434/aaa'
DEFAULT_JWT_SECRET = 'change-me-in-production'
DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b'
DEFAULT_GROQ_TIMEOUT_SECONDS = 120
DEFAULT_GROQ_MAX_TOKENS = 2048
DEFAULT_GROQ_VISION_MODEL = 'qwen/qwen3.8-27b'
DEFAULT_GROQ_VISION_MAX_TOKENS = 512
DEFAULT_GROQ_VISION_TIMEOUT_SECONDS = 360
DEFAULT_VISION_MAX_PDF_PAGES = 0
DEFAULT_VISION_MAX_IMAGE_EDGE = 768
APP_VERSION = '0.1.0'
MIGRATION_PATH = 'migrations'
_env_path = Path('.env')
load_dotenv(_env_path, override=False)


def get_database_url() -> str:
    url = os.environ.get('DATABASE_URL', DEFAULT_DATABASE_URL)
    return url


def get_jwt_secret() -> str:
    secret = os.environ.get('JWT_SECRET', DEFAULT_JWT_SECRET)
    return secret


def get_groq_api_key() -> str:
    api_key = os.environ.get('GROQ_API_KEY', '')
    return api_key


def get_groq_base_url() -> str:
    base_url = os.environ.get('GROQ_BASE_URL', DEFAULT_GROQ_BASE_URL)
    return base_url


def get_groq_chat_completions_endpoint() -> str:
    base_url = get_groq_base_url()
    base_stripped = base_url.rstrip('/')
    endpoint = f'{base_stripped}/chat/completions'
    return endpoint


def get_groq_model() -> str:
    model = os.environ.get('GROQ_MODEL', DEFAULT_GROQ_MODEL)
    return model


def get_groq_timeout_seconds() -> int:
    raw = os.environ.get('GROQ_TIMEOUT_SECONDS', str(DEFAULT_GROQ_TIMEOUT_SECONDS))
    timeout = int(raw)
    return timeout


def get_groq_max_tokens() -> int:
    raw = os.environ.get('GROQ_MAX_TOKENS')
    if raw is None:
        return DEFAULT_GROQ_MAX_TOKENS
    stripped = raw.strip()
    if len(stripped) == 0:
        return DEFAULT_GROQ_MAX_TOKENS
    max_tokens = int(stripped)
    return max_tokens


def get_groq_vision_model() -> str:
    model = os.environ.get('GROQ_VISION_MODEL', DEFAULT_GROQ_VISION_MODEL)
    return model


def get_groq_vision_max_tokens() -> int:
    raw = os.environ.get('GROQ_VISION_MAX_TOKENS', str(DEFAULT_GROQ_VISION_MAX_TOKENS))
    max_tokens = int(raw)
    return max_tokens


def get_groq_vision_timeout_seconds() -> int:
    raw = os.environ.get('GROQ_VISION_TIMEOUT_SECONDS', str(DEFAULT_GROQ_VISION_TIMEOUT_SECONDS))
    timeout = int(raw)
    return timeout


def get_vision_max_pdf_pages() -> int:
    raw = os.environ.get('VISION_MAX_PDF_PAGES', str(DEFAULT_VISION_MAX_PDF_PAGES))
    max_pages = int(raw)
    return max_pages


def get_vision_max_image_edge() -> int:
    raw = os.environ.get('VISION_MAX_IMAGE_EDGE', str(DEFAULT_VISION_MAX_IMAGE_EDGE))
    max_edge = int(raw)
    return max_edge


def get_alchemy_config() -> SQLAlchemyAsyncConfig:
    database_url = get_database_url()
    session_config = AsyncSessionConfig(expire_on_commit=False)
    alembic_config = AlembicAsyncConfig(script_location=MIGRATION_PATH)
    alchemy_config = SQLAlchemyAsyncConfig(
        connection_string=database_url,
        session_config=session_config,
        alembic_config=alembic_config,
        before_send_handler='autocommit',
    )
    return alchemy_config
