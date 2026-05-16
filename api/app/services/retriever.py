from fastapi import HTTPException
from app.core.qdrant_client import get_qdrant_client, collection_exists
from app.services.embedder import get_embedder
from app.models.responses import RecommendItem


def retrieve(text: str, collection_name: str, top_k: int) -> list[RecommendItem]:
    if not collection_exists(collection_name):
        raise HTTPException(status_code=404, detail=f"컬렉션을 찾을 수 없습니다: {collection_name}")

    vector = get_embedder().encode([text])[0]
    results = get_qdrant_client().search(
        collection_name=collection_name,
        query_vector=vector,
        limit=top_k * 3,
        with_payload=True,
    )

    # 같은 라벨이 여러 번 나오면 점수 평균, 대표 텍스트는 최고 점수 항목 사용
    label_scores: dict[str, list[float]] = {}
    label_text: dict[str, str] = {}
    for hit in results:
        label = hit.payload["label"]
        score = hit.score
        if label not in label_scores:
            label_scores[label] = []
            label_text[label] = hit.payload["original_text"]
        label_scores[label].append(score)

    aggregated = [
        RecommendItem(
            label=label,
            score=round(sum(scores) / len(scores), 4),
            original_text=label_text[label],
        )
        for label, scores in label_scores.items()
    ]
    aggregated.sort(key=lambda x: x.score, reverse=True)
    return aggregated[:top_k]
