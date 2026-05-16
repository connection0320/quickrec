import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.core.qdrant_client import collection_exists, get_qdrant_client
from app.services.embedder import get_embedder

router = APIRouter()

SYSTEM_PROMPT = (
    "당신은 데이터 기반 추천 도우미입니다. "
    "반드시 한국어로만 답변하세요. "
    "아래 제공된 컨텍스트만 사용하여 답변하세요. "
    "컨텍스트에는 '입력값 → 추천결과' 형식의 데이터가 있습니다. "
    "패턴을 분석하여 사용자 질문에 맞는 추천 결과를 알려주세요. "
    "추측하지 말고 컨텍스트에 있는 정보만 사용하세요."
)


class ChatRequest(BaseModel):
    question: str
    collection_name: str = "default"
    top_k: int = 5
    model: str = "qwen3:1.7b"


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str


@router.get("/chat/models")
def list_models():
    try:
        resp = httpx.get(f"{settings.ollama_host}/api/tags", timeout=5)
        resp.raise_for_status()
        models = [m["name"] for m in resp.json().get("models", [])]
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama 연결 실패: {e}")


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not collection_exists(req.collection_name):
        raise HTTPException(status_code=404, detail=f"컬렉션을 찾을 수 없습니다: {req.collection_name}")

    # 1. 질문 임베딩 → Qdrant 검색
    vector = get_embedder().encode([req.question])[0]
    hits = get_qdrant_client().search(
        collection_name=req.collection_name,
        query_vector=vector,
        limit=req.top_k,
        with_payload=True,
    )

    if not hits:
        raise HTTPException(status_code=404, detail="관련 데이터를 찾을 수 없습니다.")

    # 2. 컨텍스트 조립
    sources = [h.payload.get("original_text", "") for h in hits]
    labels  = [h.payload.get("label", "")         for h in hits]
    context_lines = [
        f"- {src} → {lbl}" for src, lbl in zip(sources, labels)
    ]
    context = "\n".join(context_lines)

    user_message = f"Context:\n{context}\n\nQuestion: {req.question}"

    # 3. Ollama 호출
    try:
        resp = httpx.post(
            f"{settings.ollama_host}/api/chat",
            json={
                "model": req.model,
                "messages": [
                    {"role": "system",  "content": SYSTEM_PROMPT},
                    {"role": "user",    "content": user_message},
                ],
                "stream": False,
                "options": {"temperature": 0.3},
            },
            timeout=60,
        )
        resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama 응답 시간 초과")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama 오류: {e}")

    answer = resp.json()["message"]["content"].strip()
    return ChatResponse(answer=answer, sources=sources, model=req.model)
