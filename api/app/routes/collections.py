from fastapi import APIRouter, HTTPException
from app.core.qdrant_client import get_qdrant_client, collection_exists, delete_collection

router = APIRouter()


@router.get("/collections")
def list_collections():
    names = [c.name for c in get_qdrant_client().get_collections().collections]
    return {"collections": names}


@router.delete("/collections/{name}")
def remove_collection(name: str):
    if not collection_exists(name):
        raise HTTPException(status_code=404, detail=f"컬렉션을 찾을 수 없습니다: {name}")
    delete_collection(name)
    return {"deleted": name}
