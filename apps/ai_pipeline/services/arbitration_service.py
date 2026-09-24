from PIL import Image
from core.interfaces import IConstrainedVisionEngine
from constraints.schemas import ArbitrationVerdict, DealRuleSuggestion

class ArbitrationService:
    def __init__(self, engine: IConstrainedVisionEngine):
        self._engine = engine

    def evaluate_dispute(self, deal_id: str, prompt: str, image: Image.Image) -> ArbitrationVerdict:
        verdict: ArbitrationVerdict = self._engine.infer_with_schema(
            image=image,
            prompt=prompt,
            schema=ArbitrationVerdict
        )
        verdict.deal_id = deal_id
        return verdict

    def suggest_rules(self, prompt: str, image: Image.Image) -> DealRuleSuggestion:
        return self._engine.infer_with_schema(
            image=image,
            prompt=f"Gợi ý giá và điều khoản deal: {prompt}",
            schema=DealRuleSuggestion
        )
