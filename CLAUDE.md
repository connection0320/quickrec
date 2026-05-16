# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**quickrec** — CSV 한 개와 도커 한 줄로, 5분 만에 자기 데이터로 동작하는 추천 API를 띄우는 도구.

타겟 사용자:
- 사내 시스템에 추천 기능을 붙이라는 요청을 받은 백엔드 개발자
- ML 엔지니어를 따로 뽑을 여력이 없는 작은 팀
- 외부 API에 사내 데이터를 보낼 수 없는 B2B/엔터프라이즈 환경

## Tech Stack

| 역할 | 기술 |
|------|------|
| 임베딩 모델 | sentence-transformers (`intfloat/multilingual-e5-base`) |
| 벡터 DB | Qdrant |
| API 서버 | FastAPI |
| 배포 | Docker Compose |

## Architecture

서비스 구성 (Docker Compose):
- `api` — FastAPI 앱 (포트 8000)
- `qdrant` — 벡터 DB (포트 6333)

**인덱싱 흐름:**
`POST /upload` (CSV + 폼 필드) → FastAPI가 임베딩 생성 → Qdrant 적재

**추천 흐름:**W
`POST /recommend` (쿼리 텍스트) → FastAPI가 임베딩 → Qdrant top-K 검색 → 결과 JSON 반환

**API 엔드포인트:**
- `POST /upload` — CSV 업로드 및 인덱싱
- `POST /recommend` — 텍스트 쿼리 기반 추천
- `GET /collections` — 등록된 컬렉션 목록 조회
- `DELETE /collections/{name}` — 특정 컬렉션 삭제
- `GET /health` — 서비스 상태 확인

## Key Conventions

- CSV 컬럼 매핑은 `/upload` 요청의 폼 필드로 전달: `input_column`, `label_column`
- 컬렉션 이름은 `/upload` 요청 파라미터 `collection_name` (기본값: `"default"`)
- 멀티 테넌시 지원: 한 인스턴스에서 여러 컬렉션 동시 운영 가능
- 모델은 컨테이너 내부에서 로드 — 외부 API 호출 없음 (온프레미스 완결)
