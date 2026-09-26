"""
core/factory.py
────────────────
EngineFactory: module-level singleton for OutlinesVisionEngine.

Loads the local sVLM exactly once at startup — subsequent calls return
the cached instance without re-loading weights.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from core.interfaces import IConstrainedVisionEngine
from core.outlines_engine import OutlinesVisionEngine

logger = logging.getLogger(__name__)


class EngineFactory:
    _instance: Optional[IConstrainedVisionEngine] = None

    @classmethod
    def get_engine(cls) -> IConstrainedVisionEngine:
        """
        Return the singleton engine instance.
        Initialises and loads model weights on first call.
        """
        if cls._instance is None:
            model_path = os.getenv("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")
            image_size = int(os.getenv("AI_IMAGE_SIZE", "512"))
            logger.info(
                "EngineFactory: initialising OutlinesVisionEngine — model=%s",
                model_path,
            )
            engine = OutlinesVisionEngine(
                model_id_or_path=model_path,
                image_size=image_size,
            )
            engine.load_model()
            cls._instance = engine
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Reset singleton — used in tests only."""
        cls._instance = None
