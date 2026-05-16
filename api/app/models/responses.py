from pydantic import BaseModel


class UploadResponse(BaseModel):
    collection: str
    indexed_count: int
