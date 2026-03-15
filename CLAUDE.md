# CLAUDE.md

## API 기준

- 백엔드 API 스펙 문서: https://love-soul-265481232089.asia-northeast3.run.app/v3/api-docs
- 모든 API 관련 작업(신규 연동, 필드 변경, 버그 수정 등)은 반드시 위 URL의 최신 스펙을 기준으로 진행할 것
- 백엔드 API base URL: `https://love-soul-265481232089.asia-northeast3.run.app`

## 프로젝트 구조

- Vite + React, Zustand, CSS Modules
- DEV 모드 (`VITE_API_BASE_URL` 미설정): `src/api/mockData.js`의 mock 데이터 사용
- Production: nginx proxy로 Cloud Run 백엔드 연결
- Git branch: `prd`

## 테스트 계정

- 매니저: sungjoong.kim@hancom.com / hancom123 (김성중)
- 관리자: admin@admin.com / hancom123
