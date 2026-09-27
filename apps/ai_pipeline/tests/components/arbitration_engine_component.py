"""
tests/components/arbitration_engine_component.py
Engine unit tests, confidence gating, decision rules, and fallback tests.
"""

from __future__ import annotations

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from tests.fixtures.arbitration_fixtures import (
    VALID_JSON_BODY,
    VERDICT_REFUND,
    _assert_verdict_schema,
    _make_jpeg,
    client_approve,
    client_engine_down,
    client_low_confidence,
    client_refund,
)


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
# T11 — Unit: confidence gate forces ESCALATE_TO_ADMIN at exactly 0.60
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_t11_unit_confidence_gate() -> None:
    from engines.arbitrator_engine import _apply_confidence_gate
    from schemas.arbitration import ArbitrationVerdict, VerdictAction

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
    assert gated.confidence_score == 0.60

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
    mock_engine.infer_with_schema.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
# T14 — Unit: ArbitrationVerdict schema — reasoning_summary > 200 words truncated
# ══════════════════════════════════════════════════════════════════════════════

def test_t14_reasoning_summary_truncation() -> None:
    from schemas.arbitration import ArbitrationVerdict, VerdictAction

    long_summary = " ".join([f"từ{i}" for i in range(250)])
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
    import json
    from schemas.arbitration import VerdictAction

    assert VerdictAction.APPROVE_PAYOUT.value == "APPROVE_PAYOUT"
    assert VerdictAction.TRIGGER_REFUND.value == "TRIGGER_REFUND"
    assert VerdictAction.ESCALATE_TO_ADMIN.value == "ESCALATE_TO_ADMIN"

    d = {"action": VerdictAction.TRIGGER_REFUND}
    serialised = json.dumps({"action": d["action"]})
    assert "TRIGGER_REFUND" in serialised
