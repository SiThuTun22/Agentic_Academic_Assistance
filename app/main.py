from advanced_alchemy.extensions.litestar import SQLAlchemyPlugin
from litestar import Litestar
from litestar.openapi.config import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin

from app.lib.config import APP_VERSION, get_alchemy_config
from app.lib.security import jwt_auth
from app.routes.auth import auth_router
from app.routes.chat import chat_sessions_router, documents_router, messages_router
from app.routes.health import health


def create_app() -> Litestar:
    alchemy_config = get_alchemy_config()
    alchemy_plugin = SQLAlchemyPlugin(config=alchemy_config)
    openapi_config = OpenAPIConfig(
        title='Agentic Academic Assistant',
        version=APP_VERSION,
        path='/',
        render_plugins=[ScalarRenderPlugin(path='/scalar')],
    )
    app = Litestar(
        plugins=[alchemy_plugin],
        debug=True,
        route_handlers=[health, auth_router, chat_sessions_router, documents_router, messages_router],
        openapi_config=openapi_config,
        on_app_init=[jwt_auth.on_app_init],
    )
    return app
