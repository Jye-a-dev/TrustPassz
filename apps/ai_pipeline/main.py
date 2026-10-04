"""
main.py — TrustPassz AI Pipeline (TASK-07 — AI Arbitrator Edition)
────────────────────────────────────────────────────────────────────
FastAPI application exposing:
  GET  /health                    → Engine readiness probe
  POST /api/v1/suggest-deal       → Deal pricing + inspection suggestion
  POST /api/v1/inspect            → AI Arbitrator & Dispute Engine (TASK-07)

Zero Cloud API — all inference runs locally via OutlinesVisionEngine
(Qwen2-VL-2B-Instruct + Outlines Logit Masking).

CORS configured for:
  - apps/cl_user  http://localhost:3000
  - apps/server   http://localhost:3001
  - Additional via ALLOWED_ORIGINS env var (comma-separated)
"""

from __future__ import annotations

import io
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import ValidationError

from core.factory import EngineFactory
from core.interfaces import IConstrainedVisionEngine
from routers.arbitration import router as arbitration_router
from schemas.deal_suggestion import (
    DealRuleSuggestion,
    HealthResponse,
    SuggestDealRequest,
)
from services.suggestion_service import SuggestionService

# ── Environment ────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

_ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_AI_MODEL_PATH = os.getenv("AI_MODEL_PATH", "Qwen/Qwen2-VL-2B-Instruct")

_DEFAULT_ORIGINS = [
    "http://localhost:3000",  # apps/cl_user
    "http://localhost:3001",  # apps/server (NestJS)
    "http://localhost:5100",  # apps/cl_admin
]
_extra = os.getenv("ALLOWED_ORIGINS", "")
_ALLOWED_ORIGINS: list[str] = _DEFAULT_ORIGINS + [
    o.strip() for o in _extra.split(",") if o.strip()
]


# ── Lifespan: load model once at startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = EngineFactory.get_engine()
    if engine.is_ready():
        logger.info("AI Pipeline ready — local model: %s", _AI_MODEL_PATH)
    else:
        logger.warning(
            "AI Pipeline started WITHOUT model loaded. "
            "FallbackRuleEngine active — no cloud API is used."
        )
    yield


# ── Swagger OpenAPI Tags Metadata ──────────────────────────────────────────────
tags_metadata = [
    {
        "name": "AI Suggestions",
        "description": "Gợi ý điều khoản và giá kèo: định giá, thời gian kiểm thử (TASK-06).",
    },
    {
        "name": "Arbitration",
        "description": "Trọng tài AI thẩm định bằng chứng unbox/lỗi và phân xử tranh chấp (TASK-07).",
    },
    {
        "name": "Infrastructure",
        "description": "Healthcheck và trạng thái sẵn sàng của AI Pipeline Engine.",
    },
]

# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TrustPassz AI Arbitration & Suggestion Pipeline",
    description="Interactive OpenAPI Swagger Playground phục vụ kiểm thử TASK-06 & TASK-07",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/docs-json",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
)


@app.get("/openapi.json", include_in_schema=False)
def openapi_json_alias():
    """Alias route trả về spec OpenAPI JSON cho các client/công cụ OpenAPI."""
    return app.openapi()


app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Register routers ───────────────────────────────────────────────────────────
app.include_router(arbitration_router)


# ── Global validation error handler ───────────────────────────────────────────
@app.exception_handler(ValidationError)
async def _pydantic_error_handler(
    request: Request, exc: ValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# ── Dependencies ───────────────────────────────────────────────────────────────

def get_engine() -> IConstrainedVisionEngine:
    return EngineFactory.get_engine()


def get_service(
    engine: IConstrainedVisionEngine = Depends(get_engine),
) -> SuggestionService:
    return SuggestionService(engine)


# ── Image upload helper ────────────────────────────────────────────────────────

async def _decode_upload(file: UploadFile) -> Image.Image:
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Loại file không hỗ trợ: {file.content_type}. "
                f"Chấp nhận: {', '.join(sorted(allowed))}"
            ),
        )
    raw = await file.read()
    try:
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không đọc được file ảnh: {exc}",
        ) from exc


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Healthcheck & Engine readiness probe",
    tags=["Infrastructure"],
)
def health_check(engine: IConstrainedVisionEngine = Depends(get_engine)) -> HealthResponse:
    ready = engine.is_ready()
    engine_name = type(engine).__name__
    return HealthResponse(
        status="ok" if ready else "degraded",
        ai_api_ready=ready,
        model=_AI_MODEL_PATH,
        environment=_ENVIRONMENT,
        engine_type=engine_name,
        gemini_sdk_ready=True,
        message=(
            f"AI Pipeline operational via {engine_name}"
            if ready
            else "Local model not loaded — FallbackRuleEngine active."
        ),
    )


@app.post(
    "/api/v1/suggest-deal",
    response_model=DealRuleSuggestion,
    status_code=status.HTTP_200_OK,
    summary="Gợi ý điều khoản và giá kèo (TASK-06)",
    description=(
        "Dual-mode endpoint (application/json hoặc multipart/form-data) gợi ý điều khoản, "
        "định giá và thời gian kiểm thử cho hợp đồng số. "
        "Inference chạy cục bộ qua Outlines Logit Masking — không phụ thuộc Cloud API."
    ),
    tags=["AI Suggestions"],
)
async def suggest_deal(
    request: Request,
    service: SuggestionService = Depends(get_service),
) -> DealRuleSuggestion:
    """
    **Dual-mode endpoint** — accepts `application/json` or `multipart/form-data`.

    JSON mode fields: `title`, `description`, `asset_type?`, `initial_price?`

    Form-data fields: same as above + optional `file` (image upload).

    All inference runs **locally** via Outlines Logit Masking — no API keys required.
    """
    content_type: str = request.headers.get("content-type", "")

    # ── JSON path ──────────────────────────────────────────────────────────
    if "application/json" in content_type:
        try:
            body = await request.json()
            deal_req = SuggestDealRequest.model_validate(body)
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
        return service.suggest_from_json(deal_req)

    # ── Form-data path ─────────────────────────────────────────────────────
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()

        title: str = form.get("title", "")        # type: ignore[assignment]
        description: str = form.get("description", "")  # type: ignore[assignment]

        if len(title) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Trường 'title' bắt buộc, tối thiểu 3 ký tự.",
            )
        if len(description) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Trường 'description' bắt buộc, tối thiểu 10 ký tự.",
            )

        asset_type: Optional[str] = form.get("asset_type")  # type: ignore[assignment]

        initial_price: Optional[float] = None
        ip_raw: Optional[str] = form.get("initial_price")  # type: ignore[assignment]
        if ip_raw is not None:
            try:
                initial_price = float(ip_raw)
                if initial_price < 0:
                    raise ValueError
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Trường 'initial_price' phải là số không âm.",
                )

        image: Optional[Image.Image] = None
        file_field = form.get("file")
        if file_field and isinstance(file_field, UploadFile) and file_field.filename:
            image = await _decode_upload(file_field)

        return service.suggest_from_form(
            title=title,
            description=description,
            asset_type=asset_type,
            initial_price=initial_price,
            image=image,
        )

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Sử dụng 'application/json' hoặc 'multipart/form-data'.",
    )


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "3100"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=_ENVIRONMENT == "development",
        log_level="info",
    )
