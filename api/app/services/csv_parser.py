import io
import pandas as pd
from fastapi import HTTPException


def parse_csv(
    file: io.BytesIO,
    input_columns: list[str],
    label_column: str,
) -> pd.DataFrame:
    try:
        df = pd.read_csv(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV 파싱 실패: {e}")

    needed = list(dict.fromkeys(input_columns + [label_column]))  # 순서 유지 + 중복 제거
    missing = [col for col in needed if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"컬럼을 찾을 수 없습니다: {missing}. 실제 컬럼: {df.columns.tolist()}",
        )

    df = df[needed].dropna().drop_duplicates()

    if df.empty:
        raise HTTPException(status_code=400, detail="유효한 데이터가 없습니다.")

    # 여러 컬럼을 "컬럼명: 값" 형태로 합쳐서 _input 생성
    embed_cols = [c for c in input_columns if c != label_column]
    if not embed_cols:
        embed_cols = input_columns  # label만 선택한 극단적 케이스 방어

    if len(embed_cols) == 1:
        df["_input"] = df[embed_cols[0]].astype(str)
    else:
        df["_input"] = df.apply(
            lambda row: " | ".join(f"{col}: {row[col]}" for col in embed_cols),
            axis=1,
        )

    return df[["_input", label_column]].copy()
