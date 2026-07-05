from __future__ import annotations

import uuid

from litestar.connection import ASGIConnection
from litestar.security.jwt import Token
from litestar.security.jwt.auth import JWTAuth
from pwdlib import PasswordHash

from app.db.models import User
from app.lib.config import get_alchemy_config, get_jwt_secret
from app.repositories.user import UserRepo

_password_hasher = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    hashed = _password_hasher.hash(plain)
    return hashed


def verify_password(plain: str, hashed: str) -> bool:
    is_valid = _password_hasher.verify(plain, hashed)
    return is_valid


async def retrieve_user_from_token(token: Token, connection: ASGIConnection) -> User | None:
    _ = connection
    user_id = uuid.UUID(token.sub)
    alchemy_config = get_alchemy_config()
    session_maker = alchemy_config.create_session_maker()
    async with session_maker() as session:
        repo = UserRepo(session=session)
        user = await repo.get_one_or_none(id=user_id)
    if user is None:
        return None
    if not user.is_active:
        return None
    return user


jwt_auth = JWTAuth[User](
    retrieve_user_handler=retrieve_user_from_token,
    token_secret=get_jwt_secret(),
    exclude=['/health', '^/$', '/scalar', '/openapi.json', '/api/auth/login', '/api/auth/register'],
)
