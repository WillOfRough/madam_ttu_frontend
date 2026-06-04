# CLAUDE.md

## 🚨 prd 브랜치 / 운영 환경 테스트 안전 규칙 (절대 준수)

prd 브랜치는 운영 환경(`love-soul` 백엔드 + 실제 회원 DB) 을 가리킨다.
실제 회원의 휴대폰 번호와 개인정보가 연결돼 있으므로, prd 브랜치 또는 운영
백엔드 대상으로 테스트·검증·재현·디버깅을 진행할 때 아래는 **절대 금지** 한다.

### ❌ 절대 금지

- **실제 회원 휴대폰 번호로 SMS 가 발송되는 모든 행위**
  - 매칭 생성·시작, 일정 확정/변경, 매칭 상태 전환 등 자동 문자 트리거 API 일체
  - 매니저/관리자 OTP, 비밀번호 재설정 등 인증 SMS 트리거 API
- **운영 DB 의 상태를 바꾸는 모든 쓰기 작업**
  - POST(생성) / PUT·PATCH(수정·업데이트) / DELETE(삭제) 전부
  - 매칭 생성·변경·삭제, 회원 등록·수정·삭제, 매니저/관리자 정보 변경 등 일체

### ✅ 허용

- **순수 조회(GET) 만 허용**: 회원 데이터 조회, 매칭 리스트 조회, 대시보드 통계 등 read-only

### 쓰기·SMS 검증이 필요할 때

- 반드시 **dev 브랜치 + dev 백엔드(`dev-knotsandlinks-backend`)** 환경에서 진행한다.
- 운영 환경에서만 재현되는 이슈를 부득이 prd 에서 봐야 할 경우, **사용자에게 명시적
  사전 승인** 을 받고 영향 범위를 좁힌 read-only 관찰만 한다.

Claude(에이전트) 도 본 규칙을 동일하게 따른다. prd 컨텍스트에서 쓰기/SMS 트리거
호출이 필요한 작업 요청이 들어오면 실행하지 말고 먼저 사용자에게 확인한다.

## 🧪 dev 브랜치 / 개발 환경 테스트 규칙

dev 브랜치는 dev 백엔드(`dev-knotsandlinks-backend`) 를 가리키는 **테스트 서버**다.
쓰기 작업·매칭 생성/변경/삭제·회원 등록·SMS 트리거 등 모든 동작을 자유롭게
테스트해도 된다.

### ❗ 단, 한 가지 절대 규칙

- **SMS 가 발송되는 모든 테스트의 휴대폰 번호는 무조건 `010-4540-7441` 로 통일**
- 위 번호 외 **다른 번호로는 절대 테스트하지 않는다** (실제 사용자·동료·임의 번호 일체 금지)
- 적용 범위: 회원 생성, 매니저 등록, 매칭 일정 알림, OTP 인증, 비밀번호 재설정 등
  휴대폰 번호 입력이 들어가는 모든 테스트 필드

Claude(에이전트) 가 dev 브랜치에서 테스트용 회원·매니저·매칭을 생성하거나 SMS
트리거 동작을 호출할 때도, 휴대폰 번호 입력값은 무조건 `010-4540-7441` 로
하드코딩한다. 다른 번호가 필요해 보이면 실행 전에 사용자에게 확인한다.

## 🔀 브랜치 운영 워크플로우

dev 브랜치에는 dev 백엔드에만 있는 기능과 맞물린 프론트 작업이 섞여 있으므로,
**dev → prd 통머지는 금지** 한다. (운영 백엔드에 없는 기능이 prd 로 딸려감)

### 백엔드 의존이 없는 작업 (단순 UI 수정·버그 픽스 등)

1. **prd 브랜치를 base 로 작업 브랜치를 생성**한다.
   ```bash
   git checkout prd && git pull && git checkout -b fix/some-issue
   ```
2. 작업 완료 후 해당 브랜치를 **dev 와 prd 양쪽에 각각 머지**한다.
3. 양쪽 머지가 끝나면 **작업 브랜치는 삭제**한다. (로컬·원격 모두)
   ```bash
   git branch -d fix/some-issue && git push origin --delete fix/some-issue
   ```
4. dev/prd 브랜치에 직접 커밋하지 않는다.

### 백엔드 의존이 있는 작업 (API 신규 연동, 필드 변경 등)

- **dev 브랜치에서만 작업·머지**하고, 운영 백엔드 배포 시점에 맞춰
  해당 작업만 prd 에 반영한다. (백엔드와 프론트가 함께 릴리스되어야 함)

Claude(에이전트) 도 수정 작업 시작 전에 백엔드 의존 여부를 판단해 위 흐름을
따른다. 애매하면 사용자에게 확인한다.

## API 기준

- 백엔드 API 스펙 문서: https://love-soul-265481232089.asia-northeast3.run.app/v3/api-docs
- 모든 API 관련 작업(신규 연동, 필드 변경, 버그 수정 등)은 반드시 위 URL의 최신 스펙을 기준으로 진행할 것
- 백엔드 API base URL: `https://love-soul-265481232089.asia-northeast3.run.app`

## 공통 UI 컴포넌트 맵 (UI 수정 시 먼저 확인)

UI 를 수정·추가할 때 페이지에서 직접 마크업/스타일을 짜기 전에 아래 공통
프리미티브를 먼저 사용한다. (중복 제거 → 한곳만 고치면 전 페이지 반영)

- **빈 상태**: `src/components/EmptyState.jsx` — `<EmptyState icon title hint />`
- **카드 표면**: `src/components/Card.module.css` 가 카드 배경·모서리·그림자의 단일 출처.
  - 페이지 내 콘텐츠 카드: `.card { composes: card from '.../components/Card.module.css'; }` 로 surface 만 가져오고 여백/테두리는 페이지에 둔다.
  - 개별/리스트 카드: `<Card>` 컴포넌트 (`src/components/Card.jsx`).
- **폼 입력**: `TextField` / `SelectField` / `RadioGroup` / `PhoneVerifyField` / `KeywordTagInput`
- **상태 배지**: `StatusBadge`, **요약 카드**: `SummaryCard`, **페이지네이션**: `Pagination`
- **확인 모달**: `ConfirmModal`, **토스트**: `store/toastStore` 의 `toast`
- **색/모서리/그림자**: 생 hex 대신 `src/styles/global.css` 의 CSS 변수(`--ink-*`, `--tangerine-*`, `--r-*`, `--sh-*`) 사용.

고유 디자인(Settings 글래스, ServiceIntro·EventIntro 애니메이션, ConnectManager 히어로)은
공통화 대상이 아니므로 그대로 둔다.

## 프로젝트 구조

- Vite + React, Zustand, CSS Modules
- DEV 모드 (`VITE_API_BASE_URL` 미설정): `src/api/mockData.js`의 mock 데이터 사용
- Production: nginx proxy로 Cloud Run 백엔드 연결
- Git branch: `prd`

## 테스트 계정

- 매니저: sungjoong.kim@hancom.com / hancom123 (김성중)
- 관리자: admin@admin.com / hancom123

## 최초 clone 후 로컬 셋업

```bash
npm ci
cp .mcp.json.example .mcp.json   # Claude Code MCP 설정 (gitignore 대상)
```

`.mcp.json` 은 개발자별 로컬 설정이라 추적하지 않는다. 기본값은 dev 백엔드를
가리키며, prd MCP 가 필요한 특수 상황에서만 로컬에서 직접 수정한다.
(prd 환경 쓰기 금지 안전 규칙 준수)
