"""
test_suggestion.py
──────────────────
Pytest test suite for TrustPassz AI Pipeline — TASK-06 (Local sVLM Edition).

All tests are hermetic: OutlinesVisionEngine is mocked so no model weights
are required. Uses ASGI transport (httpx) — no real HTTP server needed.

Test categories:
  T1  Happy Path — JSON body
  T2  Happy Path — Form-data (text only)
  T3  Happy Path — Form-data + image upload
  T4  Validation Error — missing description (JSON)
  T5  Validation Error — title too short
  T6  Validation Error — description too short
  T7  Validation Error — negative initial_price (form)
  T8  Health check — engine ready
  T9  Health check — engine NOT ready (degraded)
  T10 FallbackRuleEngine unit test — 5 keyword categories, schema compliance
"""

from __future__ import annotations

import io
import os
from typing import Optional
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image

os.environ.setdefault("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")
os.environ.setdefault("AI_DEVICE", "cpu")
os.environ.setdefault("ENVIRONMENT", "test")


# ── Shared fixture data ────────────────────────────────────────────────────────

VALID_SUGGESTION: dict = {
    "category": "SOURCE_CODE",
    "suggested_min_price": 1_000_000.0,
    "suggested_max_price": 5_000_000.0,
    "suggested_inspection_hours": 24,
    "risk_level": "HIGH",
    "recommended_rules": [
        "Buyer phải kiểm tra toàn bộ chức năng trong 24h.",
        "Seller cung cấp tài liệu README và hướng dẫn cài đặt.",
        "Không hoàn tiền sau khi hết thời gian kiểm thử.",
        "Mã nguồn phải được transfer qua kho lưu trữ riêng tư.",
        "Tranh chấp được TrustPassz Admin xem xét trong vòng 24h.",
    ],
    "reasoning": "Source code phức tạp, cần 24h kiểm thử toàn diện.",
}

VALID_JSON_PAYLOAD: dict = {
    "title": "WordPress Affiliate Plugin v3.2",
    "description": (
        "Plugin PHP thuần, 2000 dòng code, tích hợp WooCommerce, "
        "hỗ trợ multi-tier commission, đã test với WP 6.5."
    ),
    "asset_type": "SOURCE_CODE",
    "initial_price": 2_500_000,
}


# ── Mock engine helpers ────────────────────────────────────────────────────────

def _make_mock_engine(ready: bool = True, raises: Optional[Exception] = None):
    from schemas.deal_suggestion import DealRuleSuggestion

    mock = MagicMock()
    mock.is_ready.return_value = ready
    mock.load_model.return_value = None
    if raises:
        mock.infer_with_schema.side_effect = raises
    else:
        mock.infer_with_schema.return_value = DealRuleSuggestion.model_validate(
            VALID_SUGGESTION
        )
    return mock


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture()
def mock_engine():
    return _make_mock_engine(ready=True)


@pytest.fixture()
def mock_engine_not_ready():
    return _make_mock_engine(ready=False)


@pytest_asyncio.fixture()
async def client(mock_engine):
    """ASGI client with OutlinesVisionEngine mocked out."""
    from core.factory import EngineFactory
    from main import app, get_engine

    EngineFactory.reset()
    app.dependency_overrides[get_engine] = lambda: mock_engine

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()


@pytest_asyncio.fixture()
async def client_not_ready(mock_engine_not_ready):
    from core.factory import EngineFactory
    from main import app, get_engine

    EngineFactory.reset()
    app.dependency_overrides[get_engine] = lambda: mock_engine_not_ready

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
    EngineFactory.reset()


# ── Assertion helper ───────────────────────────────────────────────────────────

def _assert_valid(data: dict) -> None:
    assert data["category"] in {
        "SOURCE_CODE", "LICENSE_KEY", "ACCOUNT_CREDENTIAL", "DESIGN_ASSET", "OTHER"
    }
    assert data["suggested_min_price"] >= 0
    assert data["suggested_max_price"] >= data["suggested_min_price"]
    assert data["suggested_inspection_hours"] in (6, 12, 24)
    assert data["risk_level"] in ("LOW", "MEDIUM", "HIGH")
    assert isinstance(data["recommended_rules"], list) and len(data["recommended_rules"]) >= 3
    assert isinstance(data["reasoning"], str) and len(data["reasoning"]) > 0


def _make_jpeg() -> bytes:
    img = Image.new("RGB", (64, 64), color=(80, 120, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ══════════════════════════════════════════════════════════════════════════════
# T1 — Happy Path: JSON body
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t1_happy_path_json(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/suggest-deal", json=VALID_JSON_PAYLOAD)
    assert resp.status_code == 200
    _assert_valid(resp.json())
    assert resp.json()["category"] == "SOURCE_CODE"


# ══════════════════════════════════════════════════════════════════════════════
# T2 — Happy Path: Form-data, no image
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t2_happy_path_form_text_only(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        data={
            "title": "Figma UI Kit — E-commerce Dashboard",
            "description": (
                "Bộ component Figma 150+ screens, dark/light mode, "
                "responsive grid, dùng cho dự án thương mại điện tử B2B."
            ),
            "asset_type": "DESIGN_ASSET",
            "initial_price": "800000",
        },
    )
    assert resp.status_code == 200
    _assert_valid(resp.json())


# ══════════════════════════════════════════════════════════════════════════════
# T3 — Happy Path: Form-data + image upload
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t3_happy_path_form_with_image(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        data={
            "title": "Canva Pro Account — 1 Seat",
            "description": (
                "Tài khoản Canva Pro 1 ghế, còn hạn 8 tháng, "
                "chưa chia sẻ, đầy đủ tính năng premium."
            ),
            "asset_type": "ACCOUNT_CREDENTIAL",
        },
        files={"file": ("screenshot.jpg", io.BytesIO(_make_jpeg()), "image/jpeg")},
    )
    assert resp.status_code == 200
    _assert_valid(resp.json())


# ══════════════════════════════════════════════════════════════════════════════
# T4 — Validation Error: missing description
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t4_missing_description(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        json={"title": "Title only no description"},
    )
    assert resp.status_code == 422
    field_names = [e["loc"][-1] for e in resp.json()["detail"]]
    assert "description" in field_names


# ══════════════════════════════════════════════════════════════════════════════
# T5 — Validation Error: title too short
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t5_title_too_short(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        json={"title": "AB", "description": "Mô tả đủ dài để không lỗi validation."},
    )
    assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# T6 — Validation Error: description too short
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t6_description_too_short(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        json={"title": "Valid Title Here", "description": "Quá ngắn"},
    )
    assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# T7 — Validation Error: negative initial_price (form)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t7_negative_price_form(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/suggest-deal",
        data={
            "title": "Test Product Title",
            "description": "Mô tả đủ dài để không bị lỗi validation mô tả.",
            "initial_price": "-500",
        },
    )
    assert resp.status_code == 422
    assert "initial_price" in resp.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# T8 — Health check: engine ready
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t8_health_ready(client: AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["ai_api_ready"] is True
    assert data["environment"] == "test"


# ══════════════════════════════════════════════════════════════════════════════
# T9 — Health check: degraded (engine not ready)
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t9_health_degraded(client_not_ready: AsyncClient) -> None:
    resp = await client_not_ready.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "degraded"
    assert data["ai_api_ready"] is False
    assert data["message"] is not None
    assert "cloud" not in data["message"].lower() or "no cloud" in data["message"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# T10 — FallbackRuleEngine: schema compliance across 5 keyword categories
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t10_fallback_all_categories() -> None:
    from core.outlines_engine import FallbackRuleEngine
    from schemas.deal_suggestion import DealRuleSuggestion

    fallback = FallbackRuleEngine()
    assert fallback.is_ready()

    blank = Image.new("RGB", (1, 1))
    cases = [
        ("Plugin source code PHP WooCommerce", "SOURCE_CODE"),
        ("License key Adobe Photoshop bản quyền", "LICENSE_KEY"),
        ("Account credential Netflix premium tài khoản", "ACCOUNT_CREDENTIAL"),
        ("Design asset Figma UI Kit dashboard", "DESIGN_ASSET"),
        ("Sản phẩm không rõ loại", "OTHER"),
    ]

    for prompt, expected_cat in cases:
        result: DealRuleSuggestion = fallback.infer_with_schema(
            image=blank, prompt=prompt, schema=DealRuleSuggestion
        )
        d = result.model_dump()
        _assert_valid(d)
        assert result.suggested_inspection_hours in (6, 12, 24), (
            f"Inspection hours {result.suggested_inspection_hours} not in (6,12,24)"
        )
        assert result.suggested_max_price >= result.suggested_min_price
        assert d["category"] == expected_cat, (
            f"Expected {expected_cat} for prompt={prompt!r}, got {d['category']}"
        )
