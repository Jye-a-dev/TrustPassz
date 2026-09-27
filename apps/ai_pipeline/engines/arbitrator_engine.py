"""
engines/arbitrator_engine.py
─────────────────────────────
TASK-07: AI Arbitrator & Dispute Engine

Architecture:
  ArbitratorEngine
    ├── Uses EngineFactory singleton (OutlinesVisionEngine or FallbackRuleEngine)
    ├── Builds domain-specific system prompt for digital asset dispute arbitration
    ├── Runs outlines.generate.json(model, ArbitrationVerdict) → FSM logit masking
    ├── Post-processes: enforces confidence < 0.75 → ESCALATE_TO_ADMIN override
    └── On ANY hardware/VRAM error → heuristic fallback (ESCALATE, conf=0.5)

Prompt design covers TrustPassz digital asset dispute scenarios:
  - Runtime errors (crashes, exceptions in delivered software)
  - Wrong/expired license keys (token die, key revoked, already used)
  - Account credential mismatch (wrong password, 2FA locked, ban)
  - Misdescription (feature gap between listing and actual delivery)
  - Tampered evidence (screenshot metadata manipulation)
"""

from __future__ import annotations

import io
import logging
import os
from typing import List, Optional

import httpx
from PIL import Image

from core.interfaces import IConstrainedVisionEngine
from schemas.arbitration import ArbitrationVerdict, VerdictAction

logger = logging.getLogger(__name__)

# Confidence threshold below which verdict is always ESCALATE_TO_ADMIN
_CONFIDENCE_THRESHOLD: float = float(
    os.getenv("ARBITRATION_CONFIDENCE_THRESHOLD", "0.75")
)

# Timeout in seconds for fetching evidence images from remote URLs
_EVIDENCE_FETCH_TIMEOUT: float = float(
    os.getenv("EVIDENCE_FETCH_TIMEOUT", "10")
)


# Blank 1×1 RGB placeholder for text-only inference (no image evidence)
_BLANK_IMAGE = Image.new("RGB", (1, 1), (255, 255, 255))

# ── System prompt template ─────────────────────────────────────────────────────
# Written for small VLMs (Qwen2-VL-2B). Compact, instruction-following style.
# Covers all TrustPassz dispute categories.

_SYSTEM_PROMPT_TEMPLATE = """\
Bạn là TrustPassz AI Arbitrator — hệ thống phân xử tranh chấp giao dịch tài sản số.

=== THÔNG TIN DEAL ===
Deal ID: {deal_id}
Tiêu đề: {deal_title}
Mô tả & điều khoản cam kết:
{deal_description}

=== KHIẾU NẠI CỦA NGƯỜI MUA ===
{dispute_reason}

{log_section}
=== HƯỚNG DẪN PHÂN XỬ ===
Phân tích kỹ bằng chứng (ảnh chụp màn hình, log lỗi) và đưa ra phán quyết dựa trên:

1. LỖI RUNTIME / CRASH:
   - Nếu log/ảnh cho thấy exception rõ ràng do code người bán → TRIGGER_REFUND
   - Nếu lỗi do môi trường người mua (wrong OS, missing dependency họ tự thêm) → APPROVE_PAYOUT

2. LICENSE KEY / TOKEN:
   - Key đã dùng/revoked/expired trước khi bàn giao → TRIGGER_REFUND
   - Key hợp lệ nhưng buyer dùng sai hướng dẫn → APPROVE_PAYOUT
   - Không đủ bằng chứng → ESCALATE_TO_ADMIN

3. ACCOUNT / CREDENTIAL:
   - Sai mật khẩu, 2FA không hoạt động ngay lúc nhận → TRIGGER_REFUND
   - Buyer đã đăng nhập thành công rồi sau đó mất → APPROVE_PAYOUT
   - Account bị ban do hành vi buyer sau giao dịch → APPROVE_PAYOUT

4. SAI MÔ TẢ / TÍNH NĂNG THIẾU:
   - Tính năng được liệt kê rõ trong deal_description nhưng không có trong sản phẩm → TRIGGER_REFUND
   - Buyer hiểu nhầm scope ngoài cam kết → APPROVE_PAYOUT

5. BẰNG CHỨNG GIẢ MẠO:
   - Metadata ảnh không khớp, timestamp bất thường, dấu hiệu chỉnh sửa → evidence_verified=false, ESCALATE_TO_ADMIN

Điền đầy đủ JSON theo schema. confidence_score phản ánh mức chắc chắn 0.0-1.0.
Nếu bằng chứng không đủ rõ ràng, đặt confidence_score < 0.75.
violated_rules: liệt kê điều khoản cam kết cụ thể bị vi phạm (trích từ deal_description).
reasoning_summary: tóm tắt logic phân xử dưới 200 từ, khách quan, không thiên vị.

Xuất JSON hợp lệ theo schema ArbitrationVerdict:
"""


def _build_prompt(
    deal_id: str,
    deal_title: str,
    deal_description: str,
    dispute_reason: str,
    log_text: Optional[str],
) -> str:
    log_section = ""
    if log_text and log_text.strip():
        # Truncate log to 2000 chars so small VLM context isn't overwhelmed
        truncated = log_text.strip()[:2000]
        log_section = f"=== LOG LỖI ===\n{truncated}\n\n"

    return _SYSTEM_PROMPT_TEMPLATE.format(
        deal_id=deal_id,
        deal_title=deal_title,
        deal_description=deal_description,
        dispute_reason=dispute_reason,
        log_section=log_section,
    )


async def _fetch_image_from_url(url: str) -> Optional[Image.Image]:
    """Download and decode an image from a Supabase Storage URL."""
    try:
        async with httpx.AsyncClient(timeout=_EVIDENCE_FETCH_TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as exc:
        logger.warning("Failed to fetch evidence image from %s: %s", url, exc)
        return None


def _merge_evidence_images(images: List[Image.Image]) -> Image.Image:
    """
    Tile multiple evidence screenshots into a single image grid.
    Outlines transformers_vision passes a single PIL image to the vision encoder,
    so we composite up to 4 screenshots into a 2×2 grid (512×512 target each cell).
    """
    if not images:
        return _BLANK_IMAGE.copy()
    if len(images) == 1:
        return images[0]

    # Take up to 4 images, arrange in a 2×N grid
    imgs = images[:4]
    cell_size = 256  # each cell 256×256 → 2×2 = 512×512 total
    cols = 2
    rows = (len(imgs) + 1) // 2
    canvas = Image.new("RGB", (cols * cell_size, rows * cell_size), (255, 255, 255))

    for idx, img in enumerate(imgs):
        img_resized = img.resize((cell_size, cell_size), Image.LANCZOS)
        r, c = divmod(idx, cols)
        canvas.paste(img_resized, (c * cell_size, r * cell_size))

    return canvas


def _apply_confidence_gate(verdict: ArbitrationVerdict) -> ArbitrationVerdict:
    """
    Business rule: if confidence_score < 0.75, override action to ESCALATE_TO_ADMIN.
    This prevents automated payouts/refunds when AI is uncertain.
    """
    if verdict.confidence_score < _CONFIDENCE_THRESHOLD:
        logger.info(
            "ArbitratorEngine: confidence %.3f < %.2f → overriding to ESCALATE_TO_ADMIN",
            verdict.confidence_score,
            _CONFIDENCE_THRESHOLD,
        )
        # Return new instance with action overridden (ArbitrationVerdict is immutable)
        return verdict.model_copy(update={"action": VerdictAction.ESCALATE_TO_ADMIN})
    return verdict


def _build_fallback_verdict(deal_id: str, reason: str) -> ArbitrationVerdict:
    """
    Heuristic fallback when model is unavailable or inference times out.
    Always ESCALATE_TO_ADMIN with confidence=0.5 so Smart Contract is never blocked.
    """
    logger.warning("ArbitratorEngine: fallback activated — %s", reason)
    return ArbitrationVerdict(
        deal_id=deal_id,
        action=VerdictAction.ESCALATE_TO_ADMIN,
        confidence_score=0.5,
        reasoning_summary=(
            f"[FALLBACK] Model sVLM chưa sẵn sàng hoặc lỗi phần cứng: {reason}. "
            "Tranh chấp được chuyển tự động cho Admin TrustPassz xem xét thủ công. "
            "Dòng tiền Smart Contract được giữ nguyên trạng thái escrow."
        ),
        violated_rules=[],
        evidence_verified=False,
    )


# ── Main engine class ──────────────────────────────────────────────────────────

class ArbitratorEngine:
    """
    Domain-layer orchestrator for dispute arbitration.

    Injected with an IConstrainedVisionEngine instance (typically the
    OutlinesVisionEngine singleton from EngineFactory, or a mock in tests).

    Call `arbitrate(...)` — it is async because image URL fetching is async.
    """

    def __init__(self, engine: IConstrainedVisionEngine) -> None:
        self._engine = engine

    async def arbitrate(
        self,
        deal_id: str,
        deal_title: str,
        deal_description: str,
        dispute_reason: str,
        log_text: Optional[str] = None,
        images: Optional[List[Image.Image]] = None,
        image_urls: Optional[List[str]] = None,
    ) -> ArbitrationVerdict:
        """
        Full arbitration pipeline:
          1. Fetch remote images if image_urls provided
          2. Merge evidence images into single canvas
          3. Build structured system prompt
          4. Run Outlines FSM constrained inference → ArbitrationVerdict
          5. Apply confidence gate (< 0.75 → ESCALATE_TO_ADMIN)
          6. On any error → heuristic fallback verdict

        Returns a fully validated ArbitrationVerdict Pydantic instance.
        """
        # ── Heuristic fallback if engine is not ready ──────────────────────
        if not self._engine.is_ready():
            return _build_fallback_verdict(deal_id, "engine not loaded (VRAM/RAM unavailable)")

        # ── Gather evidence images ─────────────────────────────────────────
        all_images: List[Image.Image] = list(images or [])

        if image_urls:
            for url in image_urls:
                img = await _fetch_image_from_url(url)
                if img:
                    all_images.append(img)

        evidence_image = _merge_evidence_images(all_images)

        # ── Build prompt ───────────────────────────────────────────────────
        prompt = _build_prompt(
            deal_id=deal_id,
            deal_title=deal_title,
            deal_description=deal_description,
            dispute_reason=dispute_reason,
            log_text=log_text,
        )

        # ── Constrained inference via Outlines FSM ─────────────────────────
        try:
            raw_verdict: ArbitrationVerdict = self._engine.infer_with_schema(
                image=evidence_image,
                prompt=prompt,
                schema=ArbitrationVerdict,
            )
        except Exception as exc:
            return _build_fallback_verdict(deal_id, f"inference error: {exc}")

        # ── Ensure deal_id matches request (model may echo a different value) ─
        if raw_verdict.deal_id != deal_id:
            raw_verdict = raw_verdict.model_copy(update={"deal_id": deal_id})

        # ── Apply confidence gate ──────────────────────────────────────────
        return _apply_confidence_gate(raw_verdict)
