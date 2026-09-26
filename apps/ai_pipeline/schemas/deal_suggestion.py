"""
schemas/deal_suggestion.py
──────────────────────────
Pydantic models for TASK-06: /api/v1/suggest-deal endpoint.

Design decisions:
- `DealRuleSuggestion` is used BOTH as the Gemini response_schema AND as the
  FastAPI response_model — one source of truth.
- `suggested_inspection_hours` uses `Literal[6, 12, 24]` so Gemini's JSON
  schema validator rejects any value outside the three allowed checkpoints.
- All price fields carry ge/le validators; max must satisfy >= min at the
  model level via `@model_validator`.
"""

from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator
from enum import Enum


# ── Enumerations ───────────────────────────────────────────────────────────────

class AssetCategory(str, Enum):
    SOURCE_CODE = "SOURCE_CODE"
    LICENSE_KEY = "LICENSE_KEY"
    ACCOUNT_CREDENTIAL = "ACCOUNT_CREDENTIAL"
    DESIGN_ASSET = "DESIGN_ASSET"
    OTHER = "OTHER"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# ── Primary AI Output Schema ───────────────────────────────────────────────────

class DealRuleSuggestion(BaseModel):
    """
    Structured output enforced on every Gemini response via response_schema.
    Field descriptions are forwarded into the JSON Schema sent to Gemini so
    the model understands the semantic intent of each field.
    """

    category: AssetCategory = Field(
        description=(
            "Phân loại sản phẩm số: SOURCE_CODE | LICENSE_KEY | "
            "ACCOUNT_CREDENTIAL | DESIGN_ASSET | OTHER"
        )
    )
    suggested_min_price: float = Field(
        ge=0,
        description="Mức giá sàn đề xuất tính bằng VNĐ (>= 0).",
    )
    suggested_max_price: float = Field(
        ge=0,
        description="Mức giá trần đề xuất tính bằng VNĐ (>= suggested_min_price).",
    )
    suggested_inspection_hours: Literal[6, 12, 24] = Field(
        description=(
            "Khung giờ kiểm thử được phép: chỉ một trong ba mốc 6 / 12 / 24."
        )
    )
    risk_level: RiskLevel = Field(
        description="Mức độ rủi ro giao dịch: LOW | MEDIUM | HIGH."
    )
    recommended_rules: List[str] = Field(
        min_length=3,
        description=(
            "Danh sách 3-5 điều khoản bảo vệ buyer và seller, ngắn gọn, xúc tích."
        ),
    )
    reasoning: str = Field(
        description=(
            "1-2 câu tóm tắt lý do chọn mức giá và thời gian kiểm thử đó."
        )
    )

    @model_validator(mode="after")
    def _validate_price_range(self) -> "DealRuleSuggestion":
        if self.suggested_max_price < self.suggested_min_price:
            raise ValueError(
                "suggested_max_price phải >= suggested_min_price"
            )
        return self


# ── Endpoint Request Schemas ───────────────────────────────────────────────────

class SuggestDealRequest(BaseModel):
    """
    JSON body schema for POST /api/v1/suggest-deal (non-multipart variant).
    """

    title: str = Field(
        min_length=3,
        max_length=200,
        description="Tên / tiêu đề sản phẩm số.",
    )
    description: str = Field(
        min_length=10,
        max_length=4000,
        description="Mô tả chi tiết sản phẩm số cần định giá.",
    )
    asset_type: Optional[AssetCategory] = Field(
        default=None,
        description="Gợi ý loại tài sản — để trống nếu muốn AI tự phân loại.",
    )
    initial_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Mức giá ban đầu người dùng kỳ vọng (VNĐ), tuỳ chọn.",
    )


# ── Health-check helpers ───────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "error"]
    ai_api_ready: bool
    model: str
    environment: str
    message: Optional[str] = None
