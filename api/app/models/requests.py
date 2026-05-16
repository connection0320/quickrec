from pydantic import BaseModel


class UploadRequest(BaseModel):
    collection_name: str = "default"
    input_column: str
    label_column: str
