from fastapi import APIRouter
from app.models.requests import RecommendRequest
from app.models.responses import RecommendResponse
from app.services.retriever import retrieve

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    items = retrieve(req.text, req.collection_name, req.top_k)
    return RecommendResponse(recommendations=items)
