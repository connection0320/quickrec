import uuid
import pandas as pd
from qdrant_client.models import PointStruct
from app.core.qdrant_client import get_qdrant_client, collection_exists, create_collection
from app.services.embedder import get_embedder

BATCH_SIZE = 32


def index_dataframe(
    df: pd.DataFrame,
    collection_name: str,
    input_column: str,
    label_column: str,
) -> int:
    embedder = get_embedder()
    client = get_qdrant_client()

    if not collection_exists(collection_name):
        create_collection(collection_name, embedder.dimension)

    texts = df[input_column].tolist()
    labels = df[label_column].tolist()
    total = 0

    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        batch_labels = labels[i : i + BATCH_SIZE]
        vectors = embedder.encode(batch_texts)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "original_text": text,
                    "label": label,
                    "row_index": i + j,
                },
            )
            for j, (text, label, vector) in enumerate(zip(batch_texts, batch_labels, vectors))
        ]
        client.upsert(collection_name=collection_name, points=points)
        total += len(points)

    return total
