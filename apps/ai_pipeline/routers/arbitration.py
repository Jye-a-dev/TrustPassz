"""
routers/arbitration.py
───────────────────────
TASK-07: POST /api/v1/inspect — AI Arbitrator & Dispute Engine endpoint.

Dual-mode intake:
  - application/json  → parse InspectRequest Pydantic model
  - multipart/form-data → parse form fields + optional UploadFile list

Both paths converge on ArbitratorEngine.arbitrate() which:
  1. Runs Outlines FSM constrained inference (or fallback)
  2. Applies confidence gate (< 0.75 → ESCALATE_TO_ADMIN)
  3. Returns fully-validated ArbitrationVerdict

Error contract:
  - 200: verdict returned (including ESCALATE on fallback/low confidence)
  - 415: unsupported Content-Type
  - 422: validation error on required fields
  - 400: unreadable image file
"""

from __future__ import annotations

import io
import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from PIL import Image
from pydantic import ValidationError

from core.factory import EngineFactory
from core.interfaces import IConstrainedVisionEngine
from engines.arbitrator_engine import ArbitratorEngine
from schemas.arbitration import ArbitrationVerdict, InspectRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Arbitration"])

# Allowed MIME types for evidence screenshots
_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# ── Dependency ─────────────────────────────────────────────────────────────────

def get_engine() -> IConstrainedVisionEngine:
    return EngineFactory.get_engine()


def get_arbitrator(
    engine: IConstrainedVisionEngine = Depends(get_engine),
) -> ArbitratorEngine:
    return ArbitratorEngine(engine)


# ── Image decode helper ────────────────────────────────────────────────────────

async def _decode_upload(file: UploadFile) -> Image.Image:
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Loại file không hỗ trợ: {file.content_type}. "
                f"Chấp nhận: {', '.join(sorted(_ALLOWED_IMAGE_TYPES))}"
            ),
        )
    raw = await file.read()
    try:
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không đọc được file ảnh bằng chứng: {exc}",
        ) from exc


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post(
    "/inspect",
    response_model=ArbitrationVerdict,
    status_code=status.HTTP_200_OK,
    summary="AI Arbitrator: phân xử tranh chấp giao dịch tài sản số",
    description=(
        "Nhận thông tin deal, lý do khiếu nại, log lỗi và ảnh bằng chứng. "
        "Trả về phán quyết ArbitrationVerdict với action "
        "APPROVE_PAYOUT | TRIGGER_REFUND | ESCALATE_TO_ADMIN, "
        "cùng confidence_score, reasoning_summary và violated_rules. "
        "Mọi inference chạy cục bộ qua Outlines Logit Masking — không gọi Cloud API."
    ),
)
async def inspect(
    request: Request,
    arbitrator: ArbitratorEngine = Depends(get_arbitrator),
) -> ArbitrationVerdict:
    content_type: str = request.headers.get("content-type", "")

    # ── JSON path ──────────────────────────────────────────────────────────
    if "application/json" in content_type:
        try:
            body = await request.json()
            req = InspectRequest.model_validate(body)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exc.errors(),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payload JSON không hợp lệ: {exc}",
            ) from exc

        return await arbitrator.arbitrate(
            deal_id=req.deal_id,
            deal_title=req.deal_title,
            deal_description=req.deal_description,
            dispute_reason=req.dispute_reason,
            log_text=req.log_text,
            image_urls=req.image_urls,
        )

    # ── Multipart form-data path ───────────────────────────────────────────
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()

        deal_id: str = form.get("deal_id", "").strip()  # type: ignore[assignment]
        deal_title: str = form.get("deal_title", "").strip()  # type: ignore[assignment]
        deal_description: str = form.get("deal_description", "").strip()  # type: ignore[assignment]
        dispute_reason: str = form.get("dispute_reason", "").strip()  # type: ignore[assignment]
        log_text: Optional[str] = form.get("log_text") or None  # type: ignore[assignment]

        # Validate required fields
        errors: list[dict] = []
        if not deal_id:
            errors.append({"loc": ["deal_id"], "msg": "Bắt buộc nhập deal_id.", "type": "missing"})
        if len(deal_title) < 3:
            errors.append({"loc": ["deal_title"], "msg": "deal_title tối thiểu 3 ký tự.", "type": "value_error"})
        if len(deal_description) < 10:
            errors.append({"loc": ["deal_description"], "msg": "deal_description tối thiểu 10 ký tự.", "type": "value_error"})
        if len(dispute_reason) < 10:
            errors.append({"loc": ["dispute_reason"], "msg": "dispute_reason tối thiểu 10 ký tự.", "type": "value_error"})
        if errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=errors,
            )

        # Decode evidence images (multiple file fields named "file")
        images: List[Image.Image] = []
        file_fields = form.getlist("file")
        for field in file_fields:
            if isinstance(field, UploadFile) and field.filename:
                img = await _decode_upload(field)
                images.append(img)

        return await arbitrator.arbitrate(
            deal_id=deal_id,
            deal_title=deal_title,
            deal_description=deal_description,
            dispute_reason=dispute_reason,
            log_text=log_text,
            images=images if images else None,
        )

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Sử dụng 'application/json' hoặc 'multipart/form-data'.",
    )
