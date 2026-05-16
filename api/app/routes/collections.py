from fastapi import APIRouter, HTTPException
from app.core.qdrant_client import get_qdrant_client, collection_exists, delete_collection

router = APIRouter()


@router.get("/collections")
def list_collections():
    client = get_qdrant_client()
    result = []
    for c in client.get_collections().collections:
        info = client.get_collection(c.name)
        vectors_config = info.config.params.vectors
        result.append({
            "name": c.name,
            "vectors_count": info.vectors_count or 0,
            "dimension": vectors_config.size if hasattr(vectors_config, "size") else 0,
        })
    return {"collections": result}


@router.delete("/collections/{name}")
def remove_collection(name: str):
    if not collection_exists(name):
        raise HTTPException(status_code=404, detail=f"컬렉션을 찾을 수 없습니다: {name}")
    delete_collection(name)
    return {"deleted": name}
