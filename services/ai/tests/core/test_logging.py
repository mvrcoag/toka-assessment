import json
import logging
import sys

from app.core.logging import JsonFormatter, configure_logging


def test_json_formatter_includes_trace() -> None:
    formatter = JsonFormatter()
    exc_info = None
    try:
        1 / 0
    except ZeroDivisionError:
        exc_info = sys.exc_info()

    assert exc_info is not None
    record = logging.LogRecord(
        name="test",
        level=logging.ERROR,
        pathname=__file__,
        lineno=10,
        msg="boom %s",
        args=("now",),
        exc_info=exc_info,
    )
    payload = json.loads(formatter.format(record))

    assert payload["level"] == "error"
    assert payload["message"] == "boom now"
    assert payload["logger"] == "test"
    assert "timestamp" in payload
    assert "trace" in payload


def test_json_formatter_without_trace() -> None:
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=12,
        msg="hello",
        args=(),
        exc_info=None,
    )
    payload = json.loads(formatter.format(record))

    assert payload["message"] == "hello"
    assert "trace" not in payload


def test_configure_logging_sets_json_handler() -> None:
    configure_logging()
    root_logger = logging.getLogger()

    assert root_logger.level == logging.INFO
    assert len(root_logger.handlers) == 1
    handler = root_logger.handlers[0]
    assert isinstance(handler.formatter, JsonFormatter)

    uvicorn_logger = logging.getLogger("uvicorn")
    assert uvicorn_logger.level == logging.INFO
    assert uvicorn_logger.propagate is False
