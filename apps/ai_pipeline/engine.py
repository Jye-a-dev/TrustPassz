from core.factory import EngineFactory
from services.arbitration_service import ArbitrationService

def get_arbitration_service() -> ArbitrationService:
    engine = EngineFactory.get_engine()
    return ArbitrationService(engine)
