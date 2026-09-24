import os
from typing import Optional
from core.interfaces import IConstrainedVisionEngine
from core.outlines_engine import OutlinesVisionEngine

class EngineFactory:
    _instance: Optional[IConstrainedVisionEngine] = None

    @classmethod
    def get_engine(cls) -> IConstrainedVisionEngine:
        if cls._instance is None:
            model_path = os.getenv("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")
            engine = OutlinesVisionEngine(model_id_or_path=model_path)
            engine.load_model()
            cls._instance = engine
        return cls._instance
