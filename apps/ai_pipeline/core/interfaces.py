"""
core/interfaces.py
──────────────────
Abstract interface for any constrained-output vision inference engine.

Architecture:
  IConstrainedVisionEngine  (this file)
      └── OutlinesVisionEngine   (outlines_engine.py — local sVLM)
      └── FallbackRuleEngine     (rule-based heuristics, no model needed)

The interface signature uses PIL.Image as the multimodal input type so
both local sVLM engines and pure-text fallback engines are compatible.
"""

from abc import ABC, abstractmethod
from typing import Type, TypeVar

from PIL import Image
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class IConstrainedVisionEngine(ABC):
    """Abstract base for any structured-output inference backend."""

    @abstractmethod
    def load_model(self) -> None:
        """Initialise / load model weights into memory. Idempotent."""

    @abstractmethod
    def infer_with_schema(
        self,
        image: Image.Image,
        prompt: str,
        schema: Type[T],
    ) -> T:
        """
        Run inference and return a Pydantic-validated instance of *schema*.

        Parameters
        ----------
        image:  PIL Image (may be a blank 1×1 placeholder for text-only calls)
        prompt: Natural-language task description
        schema: Pydantic model class used as the output schema constraint
        """

    @abstractmethod
    def is_ready(self) -> bool:
        """Return True when the engine is initialised and ready to infer."""
