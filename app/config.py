from __future__ import annotations
import os
from pathlib import Path
from advanced_alchemy.config import AlembicAsyncConfig, AsyncSessionConfig
from advanced_alchemy.extensions.litestar import SQLAlchemyAsyncConfig
from dotenv import load_dotenv
DEFAULT_DATABASE_URL = 'postgresql+asyncpg://aaa:aaa@localhost:5434/aaa'
DEFAULT_JWT_SECRET = 'change-me-in-production'
DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'
DEFAULT_OLLAMA_MODEL = 'llama3.2'
DEFAULT_OLLAMA_TIMEOUT_SECONDS = 120
DEFAULT_OLLAMA_MAX_TOKENS = 384
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

def get_alchemy_config() -> SQLAlchemyAsyncConfig:
    database_url = get_database_url()
    session_config = AsyncSessionConfig(expire_on_commit=False)
    alembic_config = AlembicAsyncConfig(script_location=MIGRATION_PATH)
    alchemy_config = SQLAlchemyAsyncConfig(connection_string=database_url, session_config=session_config, alembic_config=alembic_config, before_send_handler='autocommit')
    return alchemy_config
