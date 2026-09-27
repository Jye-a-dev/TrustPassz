"""
tests/test_arbitration.py
──────────────────────────
TASK-07 — Aggregated pytest suite for POST /api/v1/inspect (AI Arbitrator & Dispute Engine).
Refactored into modular test components under tests/components/ and tests/fixtures/.
"""

from __future__ import annotations

# Re-export fixtures for pytest discovery
from tests.fixtures.arbitration_fixtures import (  # noqa: F401
    VALID_JSON_BODY,
    VERDICT_APPROVE,
    VERDICT_ESCALATE,
    VERDICT_REFUND,
    client_approve,
    client_engine_down,
    client_low_confidence,
    client_refund,
)

# Component 1: Engine unit tests, confidence gating & fallbacks (T01-T04, T11-T15)
from tests.components.arbitration_engine_component import (  # noqa: F401
    test_t01_happy_path_trigger_refund,
    test_t02_happy_path_approve_payout,
    test_t03_low_confidence_forces_escalate,
    test_t04_fallback_when_engine_not_ready,
    test_t11_unit_confidence_gate,
    test_t12_unit_arbitrator_engine_inference_exception,
    test_t13_unit_image_url_fetch,
    test_t14_reasoning_summary_truncation,
    test_t15_verdict_action_enum_values,
)

# Component 2: ASGI HTTP router endpoints, multipart uploads & validations (T05-T10)
from tests.components.arbitration_routes_component import (  # noqa: F401
    test_t05_http200_json_schema_valid,
    test_t06_http200_formdata_no_image,
    test_t07_http200_formdata_with_image,
    test_t08_missing_deal_id_422,
    test_t09_dispute_reason_too_short_422,
    test_t10_unsupported_content_type,
)
