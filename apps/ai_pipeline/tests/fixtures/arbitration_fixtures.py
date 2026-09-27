"""
tests/fixtures/arbitration_fixtures.py
Shared test fixtures, payload builders, and schema verifiers for AI Arbitrator tests.
"""

from __future__ import annotations

import io
import os
from typing import Optional
from unittest.mock import MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image

# ── Environment configuration ──────────────────────────────────────────────────
os.environ.setdefault("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")
os.environ.setdefault("AI_DEVICE", "cpu")
os.environ.setdefault("ENVIRONMENT", "test")

# ── Shared fixture payloads ────────────────────────────────────────────────────
VERDICT_REFUND: dict = {
    "deal_id": "DEAL-001",
    "action": "TRIGGER_REFUND",
    "confidence_score": 0.92,
    "reasoning_summary": (
        "Ảnh chụp màn hình cho thấy lỗi runtime ImportError khi chạy app. "
        "Log xác nhận thiếu dependency bên trong package của seller. "
        "Điều khoản cam kết yêu cầu app chạy được ngay sau khi cài đặt."
    ),
    "violated_rules": [
        "Seller cam kết app hoạt động ngay sau khi cài đặt theo hướng dẫn.",
        "Seller cam kết cung cấp đầy đủ dependency kèm package.",
    ],
    "evidence_verified": True,
}

VERDICT_APPROVE: dict = {
    "deal_id": "DEAL-002",
    "action": "APPROVE_PAYOUT",
    "confidence_score": 0.88,
    "reasoning_summary": (
        "Bằng chứng cho thấy buyer đã đăng nhập tài khoản thành công. "
        "Lỗi xảy ra sau 3 ngày do buyer thay đổi email trái quy định. "
        "Không có vi phạm nào từ phía seller."
    ),
    "violated_rules": [],
    "evidence_verified": True,
}

VERDICT_ESCALATE: dict = {
    "deal_id": "DEAL-003",
    "action": "ESCALATE_TO_ADMIN",
    "confidence_score": 0.61,
    "reasoning_summary": "Bằng chứng không đủ rõ ràng để phân xử tự động.",
    "violated_rules": [],
    "evidence_verified": False,
}

VALID_JSON_BODY: dict = {
    "deal_id": "DEAL-001",
    "deal_title": "WordPress Plugin WooCommerce v4.2",
    "deal_description": (
        "Plugin PHP thuần, tích hợp WooCommerce, hỗ trợ multi-tier commission. "
        "Seller cam kết: app hoạt động ngay sau khi cài đặt theo hướng dẫn đính kèm. "
        "Seller cam kết: cung cấp đầy đủ dependency kèm package."
    ),
    "dispute_reason": (
        "Sau khi cài đặt theo đúng hướng dẫn, app báo lỗi ImportError: "
        "cannot import name 'wc_tax' from 'woocommerce'. App không chạy được."
    ),
    "log_text": "ImportError: cannot import name 'wc_tax' from 'woocommerce' (line 47, main.php)",
}


# ── Mock engine builders ───────────────────────────────────────────────────────

def _make_mock_engine(
    ready: bool = True,
    verdict_dict: Optional[dict] = None,
    raises: Optional[Exception] = None,
) -> MagicMock:
    from schemas.arbitration import ArbitrationVerdict

    mock = MagicMock()
    mock.is_ready.return_value = ready
    mock.load_model.return_value = None

    if raises:
        mock.infer_with_schema.side_effect = raises
    elif verdict_dict:
        mock.infer_with_schema.return_value = ArbitrationVerdict.model_validate(verdict_dict)
    else:
        mock.infer_with_schema.return_value = ArbitrationVerdict.model_validate(VERDICT_REFUND)

    return mock


def _make_jpeg(width: int = 64, height: int = 64) -> bytes:
    img = Image.new("RGB", (width, height), color=(80, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ── Schema assertion helper ────────────────────────────────────────────────────

def _assert_verdict_schema(data: dict) -> None:
    """Validate ArbitrationVerdict response dict against all field constraints."""
    from schemas.arbitration import ArbitrationVerdict

    verdict = ArbitrationVerdict.model_validate(data)

    assert verdict.deal_id, "deal_id must be non-empty"
    assert verdict.action.value in {"APPROVE_PAYOUT", "TRIGGER_REFUND", "ESCALATE_TO_ADMIN"}
    assert 0.0 <= verdict.confidence_score <= 1.0
    assert isinstance(verdict.reasoning_summary, str) and len(verdict.reasoning_summary) > 0
    word_count = len(verdict.reasoning_summary.split())
    assert word_count <= 200, f"reasoning_summary exceeds 200 words: {word_count}"
    assert isinstance(verdict.violated_rules, list)
    assert isinstance(verdict.evidence_verified, bool)


# ── ASGI client fixtures ───────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def client_refund():
    from core.factory import EngineFactory
    from main import app
    from routers.arbitration import get_engine

    EngineFactory.reset()
    mock = _make_mock_engine(ready=True, verdict_dict=VERDICT_REFUND)
    app.dependency_overrides[get_engine] = lambda: mock

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()


@pytest_asyncio.fixture()
async def client_approve():
    from core.factory import EngineFactory
    from main import app
    from routers.arbitration import get_engine

    EngineFactory.reset()
    mock = _make_mock_engine(ready=True, verdict_dict=VERDICT_APPROVE)
    app.dependency_overrides[get_engine] = lambda: mock

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()


@pytest_asyncio.fixture()
async def client_low_confidence():
    from core.factory import EngineFactory
    from main import app
    from routers.arbitration import get_engine

    EngineFactory.reset()
    mock = _make_mock_engine(ready=True, verdict_dict=VERDICT_ESCALATE)
    app.dependency_overrides[get_engine] = lambda: mock

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()


@pytest_asyncio.fixture()
async def client_engine_down():
    from core.factory import EngineFactory
    from main import app
    from routers.arbitration import get_engine

    EngineFactory.reset()
    mock = _make_mock_engine(ready=False)
    app.dependency_overrides[get_engine] = lambda: mock

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()
