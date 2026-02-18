from app.core.logging import configure_logging
from app.presentation.api import create_app

configure_logging()
app = create_app()
