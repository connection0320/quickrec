import logging
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

_embedder: "Embedder | None" = None


class Embedder:
    def __init__(self) -> None:
        logger.info("모델 로딩 시작: %s", settings.embedding_model)
        self._model = SentenceTransformer(settings.embedding_model)
        logger.info("모델 로딩 완료 (차원수: %d)", self.dimension)

    def encode(self, texts: list[str]) -> list[list[float]]:
        # multilingual-e5 모델은 "query: " 접두사 필요
        prefixed = [f"query: {t}" for t in texts]
        vectors = self._model.encode(prefixed, normalize_embeddings=True)
        return vectors.tolist()

    @property
    def dimension(self) -> int:
        return self._model.get_sentence_embedding_dimension()


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
