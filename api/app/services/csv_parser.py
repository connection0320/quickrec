import io
import pandas as pd
from fastapi import HTTPException


def parse_csv(file: io.BytesIO, input_column: str, label_column: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV 파싱 실패: {e}")

    missing = [col for col in [input_column, label_column] if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"컬럼을 찾을 수 없습니다: {missing}. 실제 컬럼: {df.columns.tolist()}",
        )

    df = df[[input_column, label_column]].dropna().drop_duplicates()

    if df.empty:
        raise HTTPException(status_code=400, detail="유효한 데이터가 없습니다.")

    return df
