"""
tests/components/arbitration_routes_component.py
FastAPI router endpoint tests, request encoding, validation, and content negotiation.
"""

from __future__ import annotations

import io

import pytest
from httpx import AsyncClient

from tests.fixtures.arbitration_fixtures import (
    VALID_JSON_BODY,
    _assert_verdict_schema,
    _make_jpeg,
    client_refund,
)


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
