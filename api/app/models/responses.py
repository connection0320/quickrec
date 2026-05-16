from pydantic import BaseModel


class UploadResponse(BaseModel):
    collection: str
    indexed_count: int


class RecommendItem(BaseModel):
    label: str
    score: float
    original_text: str


class RecommendResponse(BaseModel):
    recommendations: list[RecommendItem]
