"""
schemas/arbitration.py
──────────────────────
Pydantic models for TASK-07: POST /api/v1/inspect — AI Arbitration Engine.

Design decisions:
- `VerdictAction` is a str Enum → serialises directly to JSON string values;
  also makes Outlines FSM enumerate only 3 valid tokens for that field.
- `ArbitrationVerdict` is the SINGLE source of truth used both as:
    1. `outlines.generate.json(model, ArbitrationVerdict)` constraint schema
    2. FastAPI `response_model`
- `reasoning_summary` is capped at 200 words via a custom validator.
- `confidence_score` uses ge/le Field constraints — Outlines FSM enforces
  numeric bounds at token level.
- `InspectRequest` handles JSON body path; multipart path is parsed in the
  router directly because UploadFile cannot appear in a Pydantic BaseModel
  used as a request body simultaneously.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ── Verdict action enum ────────────────────────────────────────────────────────

class VerdictAction(str, Enum):
    """
    Three terminal states for a TrustPassz dispute arbitration:

    APPROVE_PAYOUT   — Evidence supports seller delivered correctly;
                       buyer complaint is unfounded → release escrow to Seller.
    TRIGGER_REFUND   — Clear evidence of defect, misdescription, or non-functional
                       delivery → refund Buyer via Smart Contract.
    ESCALATE_TO_ADMIN — Evidence ambiguous / confidence < 0.75 / insufficient
                        data → queue for human review on cl_admin dashboard.
    """
    APPROVE_PAYOUT    = "APPROVE_PAYOUT"
    TRIGGER_REFUND    = "TRIGGER_REFUND"
    ESCALATE_TO_ADMIN = "ESCALATE_TO_ADMIN"


# ── Primary AI output schema (also the Outlines FSM constraint) ────────────────

class ArbitrationVerdict(BaseModel):
    """
    Structured arbitration output enforced at token level by Outlines FSM.

    Every field is constrained so the model is PHYSICALLY UNABLE to produce:
    - Markdown fences (``` json)
    - action values outside VerdictAction enum
    - confidence_score outside [0.0, 1.0]
    """

    deal_id: str = Field(
        description="ID duy nhất của giao dịch/kèo cần phân xử.",
    )
    action: VerdictAction = Field(
        description=(
            "Quyết định cuối: APPROVE_PAYOUT | TRIGGER_REFUND | ESCALATE_TO_ADMIN."
        ),
    )
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Độ tin cậy AI từ 0.0 đến 1.0. Dưới 0.75 tự động ESCALATE.",
    )
    reasoning_summary: str = Field(
        description=(
            "Giải trình ngắn gọn lý do phân xử (<= 200 từ). "
            "Nêu rõ bằng chứng nào xác nhận hoặc bác bỏ khiếu nại."
        ),
    )
    violated_rules: List[str] = Field(
        default_factory=list,
        description=(
            "Danh sách điều khoản cam kết bị vi phạm. "
            "Rỗng nếu không có vi phạm (APPROVE_PAYOUT)."
        ),
    )
    evidence_verified: bool = Field(
        description=(
            "True nếu bằng chứng ảnh/log là xác thực và không bị làm giả. "
            "False nếu nghi ngờ chỉnh sửa hoặc metadata không khớp."
        ),
    )

    @field_validator("reasoning_summary")
    @classmethod
    def _cap_reasoning_words(cls, v: str) -> str:
        words = v.split()
        if len(words) > 200:
            return " ".join(words[:200]) + " …"
        return v


# ── Endpoint request schema (JSON body path) ───────────────────────────────────

class InspectRequest(BaseModel):
    """
    JSON body for POST /api/v1/inspect when Content-Type: application/json.

    For multipart/form-data (with evidence images), fields are parsed
    directly in the router via request.form() + UploadFile.
    """

    deal_id: str = Field(
        min_length=1,
        max_length=128,
        description="ID kèo giao dịch.",
    )
    deal_title: str = Field(
        min_length=3,
        max_length=200,
        description="Tiêu đề sản phẩm/dịch vụ giao dịch.",
    )
    deal_description: str = Field(
        min_length=10,
        max_length=5000,
        description="Mô tả gốc và điều khoản cam kết của deal.",
    )
    dispute_reason: str = Field(
        min_length=10,
        max_length=2000,
        description="Lý do khiếu nại của người mua.",
    )
    log_text: Optional[str] = Field(
        default=None,
        max_length=10000,
        description="Log lỗi text đính kèm (nếu có).",
    )
    image_urls: Optional[List[str]] = Field(
        default=None,
        description="Danh sách URL ảnh bằng chứng từ Supabase Storage (thay thế file upload).",
    )
