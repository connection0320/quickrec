# quickrec

> CSV 한 개와 도커 한 줄로, 5분 만에 자기 데이터로 동작하는 추천 API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docs.docker.com/compose/)

---

## 이런 분을 위한 도구입니다

| ✅ 하는 것 | ❌ 안 하는 것 |
|-----------|-------------|
| CSV 업로드 → 즉시 추천 API 생성 | 모델 학습 / 파인튜닝 |
| 온프레미스 완결 (외부 API 호출 없음) | 실시간 피드백 기반 개인화 |
| 멀티 테넌시 (컬렉션 단위 분리) | 협업 필터링 (유저 행동 기반 추천) |
| 한국어 포함 다국어 임베딩 | 대규모 트래픽 최적화 |
| 웹 UI + REST API 동시 제공 | 클라우드 관리형 서비스 |

**타겟 사용자:**
- 사내 시스템에 추천 기능을 붙이라는 요청을 받은 백엔드 개발자
- ML 엔지니어를 따로 뽑을 여력이 없는 작은 팀
- 외부 API에 사내 데이터를 보낼 수 없는 B2B / 엔터프라이즈 환경

---

## ⚡ 5분 시작 가이드

### 1. 클론

```bash
git clone https://github.com/connection0320/quickrec.git
cd quickrec
```

### 2. 실행

```bash
docker compose up --build
```

> 첫 실행 시 임베딩 모델(~500MB) 자동 다운로드. 이후 재시작은 캐시 사용.

### 3. 웹 UI 접속

브라우저에서 [http://localhost:8000](http://localhost:8000) 열기.

### 4. CSV 업로드

샘플 파일(`examples/helpdesk_categories.csv`)로 바로 테스트할 수 있습니다.

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@examples/helpdesk_categories.csv" \
  -F "collection_name=helpdesk" \
  -F "input_column=question" \
  -F "label_column=category"
```

```json
{"collection": "helpdesk", "indexed_count": 30}
```

### 5. 추천 요청

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"text": "환불하고 싶어요", "collection_name": "helpdesk", "top_k": 3}'
```

```json
{
  "recommendations": [
    {"label": "환불/교환", "score": 0.9412, "original_text": "환불 요청합니다"},
    {"label": "결제",     "score": 0.7831, "original_text": "결제 취소 방법 알려주세요"},
    {"label": "배송",     "score": 0.6504, "original_text": "배송 조회는 어디서 하나요"}
  ]
}
```

---

## 📋 CSV 형식

컬럼 이름은 자유롭게 지정할 수 있습니다. 업로드 시 어떤 컬럼을 사용할지 지정하면 됩니다.

```csv
question,category
환불 신청하고 싶어요,환불/교환
배송이 언제 오나요,배송
비밀번호를 잊어버렸어요,계정
```

---

## 🔌 API 레퍼런스

### `POST /upload` — CSV 인덱싱

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `file` | File | — | CSV 파일 (multipart/form-data) |
| `collection_name` | string | `"default"` | 저장할 컬렉션 이름 |
| `input_column` | string | — | 임베딩할 텍스트 컬럼명 |
| `label_column` | string | — | 추천 결과로 반환할 라벨 컬럼명 |

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@data.csv" \
  -F "collection_name=my-collection" \
  -F "input_column=text" \
  -F "label_column=tag"
```

---

### `POST /recommend` — 추천 검색

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `text` | string | — | 검색할 쿼리 텍스트 |
| `collection_name` | string | `"default"` | 검색 대상 컬렉션 |
| `top_k` | int | `3` | 반환할 추천 결과 수 |

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"text": "로그인이 안 돼요", "collection_name": "helpdesk", "top_k": 3}'
```

---

### `GET /collections` — 컬렉션 목록

```bash
curl http://localhost:8000/collections
```

```json
{
  "collections": [
    {"name": "helpdesk", "vectors_count": 30, "dimension": 768}
  ]
}
```

---

### `DELETE /collections/{name}` — 컬렉션 삭제

```bash
curl -X DELETE http://localhost:8000/collections/helpdesk
```

---

### `GET /health` — 헬스체크

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

---

## 🛠 기술 스택

| 역할 | 기술 |
|------|------|
| 임베딩 모델 | [intfloat/multilingual-e5-base](https://huggingface.co/intfloat/multilingual-e5-base) — 한국어 포함 100개 언어 |
| 벡터 DB | [Qdrant](https://qdrant.tech/) v1.11 |
| API 서버 | [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn |
| 웹 UI | React + Vite (빌드 후 FastAPI가 정적 서빙) |
| 배포 | Docker Compose |

---

## 🗺 로드맵

- [x] CSV 업로드 → 임베딩 → Qdrant 인덱싱
- [x] 텍스트 쿼리 기반 추천 API
- [x] 컬렉션 관리 (목록 / 삭제)
- [x] 웹 UI (Upload / Recommend / Collections 탭)
- [x] 멀티 테넌시
- [ ] API Key 인증
- [ ] 재인덱싱 / 덮어쓰기 옵션
- [ ] 배치 추천 (`POST /recommend/batch`)
- [ ] 컬렉션별 사용 통계
- [ ] Kubernetes Helm Chart

---

## 📄 라이선스

[MIT](./LICENSE) © 2026 connection0320
