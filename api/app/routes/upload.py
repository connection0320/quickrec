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
    input_column: str = Form(default=""),
    input_columns: str = Form(default=""),  # 쉼표 구분 복수 컬럼 (예: "기안자,기안부서,양식명")
    label_column: str = Form(...),
):
    # input_columns 우선, 없으면 input_column 단수 사용
    if input_columns:
        cols = [c.strip() for c in input_columns.split(",") if c.strip()]
    elif input_column:
        cols = [input_column]
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="input_column 또는 input_columns 중 하나는 필수입니다.")

    contents = await file.read()
    df = parse_csv(io.BytesIO(contents), cols, label_column)
    count = index_dataframe(df, collection_name, label_column)
    return UploadResponse(collection=collection_name, indexed_count=count)
