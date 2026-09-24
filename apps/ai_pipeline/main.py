import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from PIL import Image
from constraints.schemas import ArbitrationVerdict, DealRuleSuggestion
from services.arbitration_service import ArbitrationService
from engine import get_arbitration_service

app = FastAPI(title="TrustPassz AI Pipeline (OOP Structured Output)")

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "ai_pipeline"}

@app.post("/api/v1/inspect", response_model=ArbitrationVerdict)
async def inspect_evidence(
    deal_id: str = Form(...),
    prompt: str = Form("So sánh lỗi bằng chứng giao dịch."),
    file: UploadFile = File(...),
    service: ArbitrationService = Depends(get_arbitration_service)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Tệp tin phải là hình ảnh")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        return service.evaluate_dispute(deal_id=deal_id, prompt=prompt, image=image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích AI: {str(e)}")

@app.post("/api/v1/suggest-deal", response_model=DealRuleSuggestion)
async def suggest_deal_rules(
    prompt: str = Form("Đề xuất quy tắc bàn giao sản phẩm."),
    file: UploadFile = File(...),
    service: ArbitrationService = Depends(get_arbitration_service)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        return service.suggest_rules(prompt=prompt, image=image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi gợi ý: {str(e)}")
