from __future__ import annotations

import os
from pathlib import Path

from advanced_alchemy.config import AlembicAsyncConfig, AsyncSessionConfig
from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig
from dotenv import load_dotenv

DEFAULT_DATABASE_URL = 'postgresql+asyncpg://aaa:aaa@localhost:5434/aaa'
DEFAULT_JWT_SECRET = 'change-me-in-production'
DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'
DEFAULT_OLLAMA_MODEL = 'qwen3:8b'
DEFAULT_OLLAMA_TIMEOUT_SECONDS = 120
DEFAULT_OLLAMA_MAX_TOKENS = 384
DEFAULT_OLLAMA_VISION_MODEL = 'qwen2.5vl:3b'
DEFAULT_OLLAMA_VISION_MAX_TOKENS = 512
DEFAULT_OLLAMA_VISION_TIMEOUT_SECONDS = 360
DEFAULT_VISION_MAX_PDF_PAGES = 2
DEFAULT_VISION_MAX_IMAGE_EDGE = 768
DEFAULT_OLLAMA_VISION_NUM_CTX = 8192
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


def get_ollama_base_url() -> str:
    base_url = os.environ.get('OLLAMA_BASE_URL', DEFAULT_OLLAMA_BASE_URL)
    return base_url


def get_ollama_chat_endpoint() -> str:
    base_url = get_ollama_base_url()
    base_stripped = base_url.rstrip('/')
    endpoint = f'{base_stripped}/api/chat'
    return endpoint


def get_ollama_model() -> str:
    model = os.environ.get('OLLAMA_MODEL', DEFAULT_OLLAMA_MODEL)
    return model


def get_ollama_timeout_seconds() -> int:
    raw = os.environ.get('OLLAMA_TIMEOUT_SECONDS', str(DEFAULT_OLLAMA_TIMEOUT_SECONDS))
    timeout = int(raw)
    return timeout


def get_ollama_max_tokens() -> int:
    raw = os.environ.get('OLLAMA_MAX_TOKENS', str(DEFAULT_OLLAMA_MAX_TOKENS))
    max_tokens = int(raw)
    return max_tokens


def get_ollama_vision_model() -> str:
    model = os.environ.get('OLLAMA_VISION_MODEL', DEFAULT_OLLAMA_VISION_MODEL)
    return model


def get_ollama_vision_max_tokens() -> int:
    raw = os.environ.get('OLLAMA_VISION_MAX_TOKENS', str(DEFAULT_OLLAMA_VISION_MAX_TOKENS))
    max_tokens = int(raw)
    return max_tokens


def get_ollama_vision_timeout_seconds() -> int:
    raw = os.environ.get('OLLAMA_VISION_TIMEOUT_SECONDS', str(DEFAULT_OLLAMA_VISION_TIMEOUT_SECONDS))
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


def get_ollama_vision_num_ctx() -> int:
    raw = os.environ.get('OLLAMA_VISION_NUM_CTX', str(DEFAULT_OLLAMA_VISION_NUM_CTX))
    num_ctx = int(raw)
    return num_ctx


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
