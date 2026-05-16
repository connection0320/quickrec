import numpy as np
import pytest
from app.services.embedder import Embedder


@pytest.fixture(scope="module")
def embedder():
    return Embedder()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))


def test_encode_returns_correct_shape(embedder):
    texts = ["안녕하세요", "반갑습니다"]
    result = embedder.encode(texts)
    assert len(result) == 2
    assert len(result[0]) == embedder.dimension


def test_similar_sentences_high_similarity(embedder):
    texts = ["환불 요청합니다", "환불 신청하고 싶어요"]
    vecs = embedder.encode(texts)
    assert cosine_similarity(vecs[0], vecs[1]) >= 0.85


def test_different_sentences_low_similarity(embedder):
    texts = ["환불 요청합니다", "오늘 날씨가 맑네요"]
    vecs = embedder.encode(texts)
    assert cosine_similarity(vecs[0], vecs[1]) < 0.9
