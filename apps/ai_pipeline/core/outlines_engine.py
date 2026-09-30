"""
core/outlines_engine.py
────────────────────────
Local sVLM engine using Outlines Logit Masking for 100% structured output.

Architecture:
  IConstrainedVisionEngine
      └── OutlinesVisionEngine   ← THIS FILE (Qwen2-VL via Outlines)
      └── FallbackRuleEngine     ← rule heuristics (no model, always ready)

Design decisions:
- Uses `outlines.models.transformers_vision()` for Qwen2-VL multimodal models
  that accept both text tokens and image pixel tensors.
- `outlines.generate.json(model, schema)` installs a JSON FSM logit processor
  that masks every non-conforming token at decode time — the model is
  PHYSICALLY UNABLE to emit markdown fences or fields outside the schema.
- Image is pre-processed to a fixed square (default 512×512 RGB) via Pillow
  before being passed to the vision encoder, preventing CPU/VRAM spikes.
- Singleton via idempotent `load_model()` + `EngineFactory` in factory.py.
- Device auto-detected: CUDA → MPS → CPU.
"""

from __future__ import annotations

import logging
import os
from typing import Optional, Type, TypeVar

from PIL import Image
from pydantic import BaseModel

from core.interfaces import IConstrainedVisionEngine

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

# ── Image preprocessing constants ─────────────────────────────────────────────
_DEFAULT_IMAGE_SIZE = int(os.getenv("AI_IMAGE_SIZE", "512"))


def _preprocess_image(image: Image.Image, size: int = _DEFAULT_IMAGE_SIZE) -> Image.Image:
    """
    Resize + convert to RGB square via high-quality Lanczos resampling.
    Keeps aspect ratio by thumbnail-fitting then center-pasting on white bg.
    """
    image = image.convert("RGB")
    image.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    offset_x = (size - image.width) // 2
    offset_y = (size - image.height) // 2
    canvas.paste(image, (offset_x, offset_y))
    return canvas


def _resolve_device() -> str:
    """Return 'cuda', 'mps', or 'cpu' based on availability."""
    device_cfg = os.getenv("AI_DEVICE", "auto").lower()
    if device_cfg != "auto":
        return device_cfg
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


# ─────────────────────────────────────────────────────────────────────────────
# Rule-based Fallback Engine (no model required — always available)
# ─────────────────────────────────────────────────────────────────────────────

class FallbackRuleEngine(IConstrainedVisionEngine):
    """
    Deterministic keyword-based heuristic engine.
    Activated when model weights are not loaded or inference fails.
    Always returns a schema-compliant DealRuleSuggestion.
    """

    def load_model(self) -> None:
        pass  # No model to load.

    def is_ready(self) -> bool:
        return True

    def infer_with_schema(
        self,
        image: Image.Image,
        prompt: str,
        schema: Type[T],
    ) -> T:
        from schemas.deal_suggestion import AssetCategory, DealRuleSuggestion, RiskLevel

        p = prompt.lower()

        if any(k in p for k in ["source code", "mã nguồn", "repo", "github", "plugin", "app"]):
            cat, lo, hi, hrs, risk = AssetCategory.SOURCE_CODE, 500_000, 5_000_000, 24, RiskLevel.HIGH
        elif any(k in p for k in ["license", "key", "bản quyền", "serial"]):
            cat, lo, hi, hrs, risk = AssetCategory.LICENSE_KEY, 200_000, 2_000_000, 12, RiskLevel.MEDIUM
        elif any(k in p for k in ["account", "tài khoản", "credential", "login"]):
            cat, lo, hi, hrs, risk = AssetCategory.ACCOUNT_CREDENTIAL, 100_000, 1_000_000, 6, RiskLevel.HIGH
        elif any(k in p for k in ["design", "thiết kế", "figma", "psd", "asset", "ui kit"]):
            cat, lo, hi, hrs, risk = AssetCategory.DESIGN_ASSET, 150_000, 1_500_000, 6, RiskLevel.LOW
        else:
            cat, lo, hi, hrs, risk = AssetCategory.OTHER, 100_000, 1_000_000, 12, RiskLevel.MEDIUM

        result = DealRuleSuggestion(
            category=cat,
            suggested_min_price=float(lo),
            suggested_max_price=float(hi),
            suggested_inspection_hours=hrs,  # type: ignore[arg-type]
            risk_level=risk,
            recommended_rules=[
                "Buyer phải kiểm tra đầy đủ chức năng trong khung giờ kiểm thử.",
                "Seller phải cung cấp tài liệu hướng dẫn sử dụng kèm sản phẩm.",
                "Không hoàn tiền sau khi hết thời gian kiểm thử đã thỏa thuận.",
                "Thông tin đăng nhập / key phải đổi mật khẩu ngay sau giao dịch.",
                "Tranh chấp phát sinh trong 24h sẽ được TrustPassz Admin xem xét.",
            ],
            reasoning=(
                f"[FALLBACK] Heuristic dựa trên từ khóa — loại tài sản {cat.value}. "
                "Model cục bộ chưa sẵn sàng; vui lòng thử lại sau khi tải xong weights."
            ),
        )
        return schema.model_validate(result.model_dump())  # type: ignore[return-value]


# ─────────────────────────────────────────────────────────────────────────────
# Outlines Vision Engine (local sVLM with Logit Masking)
# ─────────────────────────────────────────────────────────────────────────────

class OutlinesVisionEngine(IConstrainedVisionEngine):
    """
    Wraps a HuggingFace Vision-Language model via the `outlines` library.

    Constrained decoding (`outlines.generate.json`) installs a Finite State
    Machine logit processor that makes it **physically impossible** for the
    model to emit tokens that would violate the JSON schema — no markdown
    fences, no extra fields, no values outside enum/literal constraints.

    Supported model families:
      - Qwen/Qwen2-VL-*  (default, recommended)
      - vikhyatk/moondream2
      - Any HF VLM supported by outlines.models.transformers_vision()
    """

    def __init__(
        self,
        model_id_or_path: str = "Qwen/Qwen2-VL-2B-Instruct",
        image_size: int = _DEFAULT_IMAGE_SIZE,
    ) -> None:
        self.model_id_or_path = model_id_or_path
        self.image_size = image_size
        self._model: Optional[object] = None
        self._is_ready = False
        self._fallback = FallbackRuleEngine()

    # ── Lifecycle ──────────────────────────────────────────────────────────

    def load_model(self) -> None:
        """
        Load model weights exactly once (idempotent).
        Called at app startup via EngineFactory — never per-request.
        """
        if self._is_ready:
            return

        try:
            import outlines  # type: ignore[import]

            device = _resolve_device()
            logger.info(
                "OutlinesVisionEngine: loading %s on %s ...",
                self.model_id_or_path,
                device,
            )
            # transformers_vision() wraps AutoModelForCausalLM + AutoProcessor
            # and patches the logits pipeline for Outlines FSM constraints.
            self._model = outlines.models.transformers_vision(
                self.model_id_or_path,
                device=device,
            )
            self._is_ready = True
            logger.info(
                "OutlinesVisionEngine: model loaded ✅ (device=%s)", device
            )
        except Exception as exc:
            logger.error(
                "OutlinesVisionEngine: load FAILED — %s. Fallback active.", exc
            )
            self._is_ready = False

    def is_ready(self) -> bool:
        return self._is_ready and self._model is not None

    # ── Core inference ─────────────────────────────────────────────────────

    def infer_with_schema(
        self,
        image: Image.Image,
        prompt: str,
        schema: Type[T],
    ) -> T:
        """
        Run constrained decoding via Outlines JSON FSM logit masking.

        The `outlines.generate.json(model, schema)` call returns a generator
        whose __call__ is guaranteed to produce valid JSON conforming to
        `schema`'s JSON Schema — Literal[6,12,24] and Enum constraints are
        enforced at the TOKEN level during beam/greedy decode.
        """
        if not self.is_ready():
            logger.warning(
                "OutlinesVisionEngine: not ready — delegating to FallbackRuleEngine."
            )
            return self._fallback.infer_with_schema(image, prompt, schema)

        try:
            return self._infer(image=image, prompt=prompt, schema=schema)
        except Exception as exc:
            logger.warning(
                "OutlinesVisionEngine: inference error (%s) — using fallback.",
                exc,
            )
            return self._fallback.infer_with_schema(image, prompt, schema)

    # ── Private helpers ────────────────────────────────────────────────────

    def _infer(self, image: Image.Image, prompt: str, schema: Type[T]) -> T:
        import outlines  # type: ignore[import]

        # 1. Pre-process image to fixed square tensor-ready PIL image
        processed_img = _preprocess_image(image, self.image_size)

        # 2. Build JSON-constrained generator via Outlines FSM
        #    outlines.generate.json patches the model's forward() so
        #    only tokens valid under the schema's FSM are non-zero probability.
        generator = outlines.generate.json(self._model, schema)

        # 3. Build compact, instruction-style prompt for small models
        structured_prompt = (
            f"<image>\n"
            f"Bạn là chuyên gia định giá tài sản số TrustPassz.\n"
            f"Nhiệm vụ: {prompt}\n"
            f"Xuất JSON hợp lệ theo schema:"
        )

        # 4. Call generator — output is already a validated Pydantic instance
        #    (Outlines handles json.loads + model_validate internally)
        result: T = generator(structured_prompt, [processed_img])
        return result
