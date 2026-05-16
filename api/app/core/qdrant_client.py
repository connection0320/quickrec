from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config import settings

_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    return _client


def collection_exists(name: str) -> bool:
    return get_qdrant_client().collection_exists(name)


def create_collection(name: str, dimension: int) -> None:
    get_qdrant_client().create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
    )


def delete_collection(name: str) -> None:
    get_qdrant_client().delete_collection(name)
