from pydantic import BaseModel, Field
from typing import List, Literal

class DefectItem(BaseModel):
    part: str = Field(description="Vị trí lỗi: viền, mặt lưng, màn hình, key, code file")
    issue: str = Field(description="Mô tả khuyết tật: trầy xước, thiếu file, revoke key")
    severity: Literal["low", "medium", "critical"]

class ArbitrationVerdict(BaseModel):
    deal_id: str
    is_acceptable: bool
    confidence_score: float = Field(ge=0.0, le=1.0)
    defects_detected: List[DefectItem] = Field(default_factory=list)
    decision: Literal["APPROVE_PAYOUT", "TRIGGER_REFUND", "ESCALATE_TO_ADMIN"]
    summary_reason: str = Field(description="Tóm tắt lý do phân xử")

class DealRuleSuggestion(BaseModel):
    category: str = Field(description="Phân loại tài nguyên số")
    suggested_min_price: float
    suggested_max_price: float
    suggested_inspection_hours: int
    recommended_rules: List[str]
