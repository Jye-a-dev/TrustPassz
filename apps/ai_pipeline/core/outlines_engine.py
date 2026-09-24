import torch
from typing import Type, TypeVar
from PIL import Image
from pydantic import BaseModel
import outlines
from core.interfaces import IConstrainedVisionEngine

T = TypeVar("T", bound=BaseModel)

class OutlinesVisionEngine(IConstrainedVisionEngine):
    def __init__(self, model_id_or_path: str = "Qwen/Qwen2-VL-2B-Instruct"):
        self.model_id_or_path = model_id_or_path
        self._model = None
        self._is_ready = False

    def load_model(self) -> None:
        if self._is_ready:
            return
        print(f"📦 Loading vision model: {self.model_id_or_path}...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = outlines.models.transformers(
            self.model_id_or_path,
            device=device
        )
        self._is_ready = True
        print(f"✅ Model loaded on: {device}")

    def infer_with_schema(self, image: Image.Image, prompt: str, schema: Type[T]) -> T:
        if not self._is_ready or self._model is None:
            raise RuntimeError("Engine chưa được nạp. Gọi load_model() trước.")
        generator = outlines.generate.json(self._model, schema)
        formatted_prompt = (
            f"<image>\n"
            f"Bạn là trọng tài AI đối soát bằng chứng giao dịch TrustPassz.\n"
            f"Yêu cầu: {prompt}\n"
            f"Xuất JSON:"
        )
        return generator(formatted_prompt, image)

    def is_ready(self) -> bool:
        return self._is_ready
