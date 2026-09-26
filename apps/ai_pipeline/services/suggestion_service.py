"""
services/suggestion_service.py
────────────────────────────────
Business logic layer for POST /api/v1/suggest-deal.

Builds prompts optimised for small VLMs (≤ 3B params):
- Concise, structured Vietnamese instruction
- No chain-of-thought — direct JSON instruction
- Price anchor hint when provided
- Delegates constrained decoding to OutlinesVisionEngine
"""

from __future__ import annotations

import logging
from typing import Optional

from PIL import Image

from core.interfaces import IConstrainedVisionEngine
from schemas.deal_suggestion import (
    AssetCategory,
    DealRuleSuggestion,
    SuggestDealRequest,
)

logger = logging.getLogger(__name__)


class SuggestionService:
    """Orchestrates prompt construction + engine delegation."""

    def __init__(self, engine: IConstrainedVisionEngine) -> None:
        self._engine = engine

    # ── Text-only (JSON body) path ─────────────────────────────────────────

    def suggest_from_json(self, request: SuggestDealRequest) -> DealRuleSuggestion:
        prompt = self._build_prompt(
            title=request.title,
            description=request.description,
            asset_type=request.asset_type,
            initial_price=request.initial_price,
        )
        # Use blank 1×1 placeholder image for text-only requests
        blank = Image.new("RGB", (1, 1), (255, 255, 255))
        logger.info(
            "SuggestionService.suggest_from_json: title=%r", request.title
        )
        return self._engine.infer_with_schema(
            image=blank,
            prompt=prompt,
            schema=DealRuleSuggestion,
        )

    # ── Multimodal (form-data + image) path ───────────────────────────────

    def suggest_from_form(
        self,
        title: str,
        description: str,
        asset_type: Optional[str],
        initial_price: Optional[float],
        image: Optional[Image.Image] = None,
    ) -> DealRuleSuggestion:
        parsed_type: Optional[AssetCategory] = None
        if asset_type:
            try:
                parsed_type = AssetCategory(asset_type.upper())
            except ValueError:
                logger.warning(
                    "SuggestionService: unknown asset_type=%r — AI will classify.",
                    asset_type,
                )

        prompt = self._build_prompt(
            title=title,
            description=description,
            asset_type=parsed_type,
            initial_price=initial_price,
        )

        # Use blank placeholder if no image provided
        effective_image = image if image is not None else Image.new("RGB", (1, 1), (255, 255, 255))
        logger.info(
            "SuggestionService.suggest_from_form: title=%r has_image=%s",
            title,
            image is not None,
        )
        return self._engine.infer_with_schema(
            image=effective_image,
            prompt=prompt,
            schema=DealRuleSuggestion,
        )

    # ── Prompt builder ─────────────────────────────────────────────────────

    @staticmethod
    def _build_prompt(
        title: str,
        description: str,
        asset_type: Optional[AssetCategory],
        initial_price: Optional[float],
    ) -> str:
        """
        Compact prompt suitable for small VLMs (Qwen2-VL 2B / moondream2).
        Avoids chain-of-thought; uses direct field-by-field instruction.
        """
        asset_hint = (
            f"Loại: {asset_type.value}" if asset_type else "Loại: tự phân loại"
        )
        price_hint = (
            f"Giá kỳ vọng: {initial_price:,.0f} VNĐ"
            if initial_price is not None
            else "Giá kỳ vọng: chưa cung cấp"
        )
        return (
            f"Sản phẩm: {title}\n"
            f"Mô tả: {description}\n"
            f"{asset_hint} | {price_hint}\n"
            "Đề xuất giá (VNĐ), khung giờ kiểm thử [6|12|24], "
            "rủi ro [LOW|MEDIUM|HIGH], 3-5 điều khoản ngắn, lý do 1-2 câu."
        )
