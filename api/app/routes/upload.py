import io
from fastapi import APIRouter, File, Form, UploadFile
from app.models.responses import UploadResponse
from app.services.csv_parser import parse_csv
from app.services.indexer import index_dataframe

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload(
    file: UploadFile = File(...),
    collection_name: str = Form("default"),
    input_column: str = Form(...),
    label_column: str = Form(...),
):
    contents = await file.read()
    df = parse_csv(io.BytesIO(contents), input_column, label_column)
    count = index_dataframe(df, collection_name, input_column, label_column)
    return UploadResponse(collection=collection_name, indexed_count=count)
