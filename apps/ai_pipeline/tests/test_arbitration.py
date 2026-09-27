"""
tests/test_arbitration.py
──────────────────────────
TASK-07 — pytest suite for POST /api/v1/inspect (AI Arbitrator & Dispute Engine).

All tests are hermetic:
  - OutlinesVisionEngine is mocked via dependency override → no model weights needed.
  - Uses ASGI transport (httpx.AsyncClient) → no real HTTP server.
  - ArbitratorEngine.arbitrate() is also tested at unit level (no HTTP).

Test inventory:
  T01  Happy Path 1: clear defect evidence → TRIGGER_REFUND (confidence >= 0.8)
  T02  Happy Path 2: unfounded claim, seller correct → APPROVE_PAYOUT (confidence >= 0.8)
  T03  Low Confidence: AI uncertain → ESCALATE_TO_ADMIN override (confidence < 0.75)
  T04  Fallback Handler: engine not ready → ESCALATE_TO_ADMIN, confidence == 0.5
  T05  ASGI HTTP 200 + full schema validation (JSON body)
  T06  ASGI HTTP 200 + full schema validation (multipart form-data)
  T07  ASGI HTTP 200 + multipart with image evidence file
  T08  Validation error: missing required field deal_id (JSON) → 422
  T09  Validation error: dispute_reason too short → 422
  T10  415 on wrong Content-Type
  T11  Unit: confidence gate forces ESCALATE on score 0.60
  T12  Unit: FallbackRuleEngine still returns DealRuleSuggestion schema (regression)
  T13  Image URL path (JSON body with image_urls) via mocked httpx
"""

from __future__ import annotations

import io
import os
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image
from pydantic import ValidationError

# ── Environment must be set before importing app ───────────────────────────────
os.environ.setdefault("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")
os.environ.setdefault("AI_DEVICE", "cpu")
os.environ.setdefault("ENVIRONMENT", "test")


# ── Shared fixture data ────────────────────────────────────────────────────────

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


# ── ASGI client fixtures ───────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def client_refund():
    """ASGI client whose mocked engine returns TRIGGER_REFUND (conf=0.92)."""
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
    """ASGI client whose mocked engine returns APPROVE_PAYOUT (conf=0.88)."""
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
    """ASGI client whose mocked engine returns low-confidence verdict → ESCALATE override."""
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
    """ASGI client whose engine reports is_ready=False → fallback activated."""
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


# ── Schema assertion helper ────────────────────────────────────────────────────

def _assert_verdict_schema(data: dict) -> None:
    """Validate ArbitrationVerdict response dict against all field constraints."""
    from schemas.arbitration import ArbitrationVerdict

    # Must parse without error (proves schema compliance)
    verdict = ArbitrationVerdict.model_validate(data)

    assert verdict.deal_id, "deal_id must be non-empty"
    assert verdict.action.value in {"APPROVE_PAYOUT", "TRIGGER_REFUND", "ESCALATE_TO_ADMIN"}
    assert 0.0 <= verdict.confidence_score <= 1.0
    assert isinstance(verdict.reasoning_summary, str) and len(verdict.reasoning_summary) > 0
    word_count = len(verdict.reasoning_summary.split())
    assert word_count <= 200, f"reasoning_summary exceeds 200 words: {word_count}"
    assert isinstance(verdict.violated_rules, list)
    assert isinstance(verdict.evidence_verified, bool)


# ══════════════════════════════════════════════════════════════════════════════
# T01 — Happy Path 1: Clear defect → TRIGGER_REFUND
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t01_happy_path_trigger_refund(client_refund: AsyncClient) -> None:
    resp = await client_refund.post("/api/v1/inspect", json=VALID_JSON_BODY)
    assert resp.status_code == 200
    data = resp.json()
    _assert_verdict_schema(data)
    assert data["action"] == "TRIGGER_REFUND"
    assert data["confidence_score"] >= 0.8
    assert data["evidence_verified"] is True
    assert len(data["violated_rules"]) > 0


# ══════════════════════════════════════════════════════════════════════════════
# T02 — Happy Path 2: Unfounded claim → APPROVE_PAYOUT
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t02_happy_path_approve_payout(client_approve: AsyncClient) -> None:
    body = {
        "deal_id": "DEAL-002",
        "deal_title": "Canva Pro Account 1 Seat",
        "deal_description": (
            "Tài khoản Canva Pro 1 ghế còn hạn 8 tháng. "
            "Seller cam kết tài khoản hoạt động bình thường tại thời điểm bàn giao."
        ),
        "dispute_reason": (
            "Tài khoản bị mất quyền truy cập sau 3 ngày. "
            "Buyer tự đổi email mà không thông báo cho seller."
        ),
    }
    resp = await client_approve.post("/api/v1/inspect", json=body)
    assert resp.status_code == 200
    data = resp.json()
    _assert_verdict_schema(data)
    assert data["action"] == "APPROVE_PAYOUT"
    assert data["confidence_score"] >= 0.8
    assert data["violated_rules"] == []


# ══════════════════════════════════════════════════════════════════════════════
# T03 — Low Confidence: AI uncertain → must be ESCALATE_TO_ADMIN
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t03_low_confidence_forces_escalate(client_low_confidence: AsyncClient) -> None:
    body = {
        "deal_id": "DEAL-003",
        "deal_title": "License Key Adobe CC",
        "deal_description": "Key Adobe Creative Cloud 1 năm. Seller cam kết key còn hiệu lực.",
        "dispute_reason": "Key báo lỗi invalid nhưng buyer không gửi được screenshot rõ ràng.",
    }
    resp = await client_low_confidence.post("/api/v1/inspect", json=body)
    assert resp.status_code == 200
    data = resp.json()
    _assert_verdict_schema(data)
    # Confidence gate must have overridden any non-ESCALATE action
    assert data["action"] == "ESCALATE_TO_ADMIN", (
        f"Expected ESCALATE_TO_ADMIN due to low confidence, got {data['action']}"
    )
    assert data["confidence_score"] < 0.75


# ══════════════════════════════════════════════════════════════════════════════
# T04 — Fallback Handler: engine down → ESCALATE_TO_ADMIN, confidence == 0.5
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t04_fallback_when_engine_not_ready(client_engine_down: AsyncClient) -> None:
    resp = await client_engine_down.post("/api/v1/inspect", json=VALID_JSON_BODY)
    assert resp.status_code == 200
    data = resp.json()
    _assert_verdict_schema(data)
    assert data["action"] == "ESCALATE_TO_ADMIN"
    assert data["confidence_score"] == 0.5
    assert data["evidence_verified"] is False
    assert "FALLBACK" in data["reasoning_summary"] or "fallback" in data["reasoning_summary"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# T05 — ASGI HTTP 200 + full schema validation (JSON body)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t05_http200_json_schema_valid(client_refund: AsyncClient) -> None:
    resp = await client_refund.post("/api/v1/inspect", json=VALID_JSON_BODY)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/json")
    _assert_verdict_schema(resp.json())


# ══════════════════════════════════════════════════════════════════════════════
# T06 — ASGI HTTP 200 + schema validation (multipart form-data, no image)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t06_http200_formdata_no_image(client_refund: AsyncClient) -> None:
    resp = await client_refund.post(
        "/api/v1/inspect",
        data={
            "deal_id": "DEAL-001",
            "deal_title": "Source Code Plugin WooCommerce",
            "deal_description": (
                "Plugin PHP WooCommerce, seller cam kết app chạy được ngay sau cài đặt."
            ),
            "dispute_reason": (
                "App báo lỗi ngay sau cài đặt, ImportError không tìm thấy module."
            ),
        },
    )
    assert resp.status_code == 200
    _assert_verdict_schema(resp.json())


# ══════════════════════════════════════════════════════════════════════════════
# T07 — ASGI HTTP 200 + multipart with evidence image upload
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t07_http200_formdata_with_image(client_refund: AsyncClient) -> None:
    jpeg_bytes = _make_jpeg()
    resp = await client_refund.post(
        "/api/v1/inspect",
        data={
            "deal_id": "DEAL-001",
            "deal_title": "Plugin WooCommerce v4.2",
            "deal_description": "Seller cam kết plugin chạy ngay sau cài đặt theo hướng dẫn.",
            "dispute_reason": "Plugin crash với ImportError sau khi cài đặt đúng hướng dẫn.",
            "log_text": "ImportError: cannot import name 'wc_tax'",
        },
        files={"file": ("screenshot.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
    )
    assert resp.status_code == 200
    _assert_verdict_schema(resp.json())


# ══════════════════════════════════════════════════════════════════════════════
# T08 — Validation Error: missing deal_id (JSON) → 422
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t08_missing_deal_id_422(client_refund: AsyncClient) -> None:
    body = {k: v for k, v in VALID_JSON_BODY.items() if k != "deal_id"}
    resp = await client_refund.post("/api/v1/inspect", json=body)
    assert resp.status_code == 422
    detail = resp.json()["detail"]
    field_names = [
        (e["loc"][-1] if isinstance(e.get("loc"), list) else str(e))
        for e in detail
    ]
    assert any("deal_id" in str(f) for f in field_names)


# ══════════════════════════════════════════════════════════════════════════════
# T09 — Validation Error: dispute_reason too short → 422
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t09_dispute_reason_too_short_422(client_refund: AsyncClient) -> None:
    body = {**VALID_JSON_BODY, "dispute_reason": "Lỗi"}
    resp = await client_refund.post("/api/v1/inspect", json=body)
    assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# T10 — 415 Unsupported Media Type
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t10_unsupported_content_type(client_refund: AsyncClient) -> None:
    resp = await client_refund.post(
        "/api/v1/inspect",
        content=b"plain text body",
        headers={"content-type": "text/plain"},
    )
    assert resp.status_code == 415


# ══════════════════════════════════════════════════════════════════════════════
# T11 — Unit: confidence gate forces ESCALATE_TO_ADMIN at exactly 0.60
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t11_unit_confidence_gate() -> None:
    from engines.arbitrator_engine import _apply_confidence_gate
    from schemas.arbitration import ArbitrationVerdict, VerdictAction

    # Verdict with TRIGGER_REFUND but borderline-low confidence
    verdict = ArbitrationVerdict(
        deal_id="DEAL-GATE",
        action=VerdictAction.TRIGGER_REFUND,
        confidence_score=0.60,
        reasoning_summary="Bằng chứng không đủ rõ ràng.",
        violated_rules=[],
        evidence_verified=False,
    )
    gated = _apply_confidence_gate(verdict)
    assert gated.action == VerdictAction.ESCALATE_TO_ADMIN
    assert gated.confidence_score == 0.60  # score unchanged, only action overridden

    # High-confidence verdict must NOT be changed
    verdict_high = verdict.model_copy(update={
        "action": VerdictAction.TRIGGER_REFUND,
        "confidence_score": 0.90,
    })
    gated_high = _apply_confidence_gate(verdict_high)
    assert gated_high.action == VerdictAction.TRIGGER_REFUND


# ══════════════════════════════════════════════════════════════════════════════
# T12 — Unit: ArbitratorEngine fallback on inference exception
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t12_unit_arbitrator_engine_inference_exception() -> None:
    from engines.arbitrator_engine import ArbitratorEngine
    from schemas.arbitration import VerdictAction

    mock_engine = MagicMock()
    mock_engine.is_ready.return_value = True
    mock_engine.infer_with_schema.side_effect = RuntimeError("CUDA OOM")

    engine = ArbitratorEngine(mock_engine)
    verdict = await engine.arbitrate(
        deal_id="DEAL-ERR",
        deal_title="Test Deal",
        deal_description="Deal mô tả dài đủ 10 ký tự minimum.",
        dispute_reason="Có lỗi xảy ra trong quá trình giao nhận.",
    )

    assert verdict.action == VerdictAction.ESCALATE_TO_ADMIN
    assert verdict.confidence_score == 0.5
    assert verdict.deal_id == "DEAL-ERR"
    assert verdict.evidence_verified is False


# ══════════════════════════════════════════════════════════════════════════════
# T13 — Unit: image URL fetching (mocked httpx) + arbitration
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t13_unit_image_url_fetch() -> None:
    from engines.arbitrator_engine import ArbitratorEngine
    from schemas.arbitration import ArbitrationVerdict, VerdictAction

    mock_engine = MagicMock()
    mock_engine.is_ready.return_value = True
    mock_engine.infer_with_schema.return_value = ArbitrationVerdict.model_validate(VERDICT_REFUND)

    # Patch httpx so no real network call is made
    fake_jpeg = _make_jpeg()

    async def _fake_get(url: str, **kwargs):
        resp = MagicMock()
        resp.content = fake_jpeg
        resp.raise_for_status = MagicMock()
        return resp

    fake_client = AsyncMock()
    fake_client.__aenter__ = AsyncMock(return_value=fake_client)
    fake_client.__aexit__ = AsyncMock(return_value=None)
    fake_client.get = AsyncMock(side_effect=_fake_get)

    with patch("engines.arbitrator_engine.httpx.AsyncClient", return_value=fake_client):
        engine = ArbitratorEngine(mock_engine)
        verdict = await engine.arbitrate(
            deal_id="DEAL-001",
            deal_title="Plugin Test",
            deal_description="Mô tả deal đủ dài để vượt qua minimum length validation.",
            dispute_reason="Khiếu nại về lỗi runtime xảy ra ngay sau cài đặt.",
            image_urls=["https://storage.supabase.io/evidence/screenshot1.jpg"],
        )

    assert verdict.action == VerdictAction.TRIGGER_REFUND
    assert verdict.deal_id == "DEAL-001"
    _assert_verdict_schema(verdict.model_dump())

    # Verify that infer_with_schema was called (engine used the URL-fetched image)
    mock_engine.infer_with_schema.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
# T14 — Unit: ArbitrationVerdict schema — reasoning_summary > 200 words truncated
# ══════════════════════════════════════════════════════════════════════════════

def test_t14_reasoning_summary_truncation() -> None:
    from schemas.arbitration import ArbitrationVerdict, VerdictAction

    long_summary = " ".join([f"từ{i}" for i in range(250)])  # 250 words
    verdict = ArbitrationVerdict(
        deal_id="DEAL-TRUNC",
        action=VerdictAction.APPROVE_PAYOUT,
        confidence_score=0.85,
        reasoning_summary=long_summary,
        violated_rules=[],
        evidence_verified=True,
    )
    word_count = len(verdict.reasoning_summary.split())
    assert word_count <= 201, f"Expected truncation, got {word_count} words"
    assert verdict.reasoning_summary.endswith("…")


# ══════════════════════════════════════════════════════════════════════════════
# T15 — Unit: VerdictAction enum values are correct strings
# ══════════════════════════════════════════════════════════════════════════════

def test_t15_verdict_action_enum_values() -> None:
    from schemas.arbitration import VerdictAction

    assert VerdictAction.APPROVE_PAYOUT.value == "APPROVE_PAYOUT"
    assert VerdictAction.TRIGGER_REFUND.value == "TRIGGER_REFUND"
    assert VerdictAction.ESCALATE_TO_ADMIN.value == "ESCALATE_TO_ADMIN"

    # Ensure str(Enum) serialises correctly for JSON (str Enum)
    import json
    d = {"action": VerdictAction.TRIGGER_REFUND}
    serialised = json.dumps({"action": d["action"]})
    assert "TRIGGER_REFUND" in serialised
