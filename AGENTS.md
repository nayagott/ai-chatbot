# AI 챗봇 프로젝트

## 프로젝트 개요

AWS Bedrock의 Claude 모델을 사용하는 웹 기반 AI 챗봇 애플리케이션

## 기술 스택

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- AI: AWS Bedrock (Claude Sonnet 4.6 / Haiku 4.5)
- API: Converse API with ConverseStream
- Streaming: Server-Sent Events (SSE)

## 프로젝트 구조

프로젝트는 스캐폴딩(테스트 환경 검증)까지만 초기화된 상태이며, 기능 구현은 TDD로 처음부터 다시 쌓아 올립니다.

ai-chatbot/
├── frontend/ # Vite + React + TypeScript 클라이언트
│ ├── src/
│ │ ├── App.tsx # 최소 placeholder (구현 전)
│ │ └── test/setup.ts # Vitest 전역 설정 (jest-dom 등)
│ └── vite.config.ts # test 블록 포함 (Vitest 설정)
├── backend/ # Express + TypeScript 서버
│ ├── tests/ # Vitest 테스트 (\*.test.ts)
│ └── vitest.config.ts # environment: 'node' 설정
├── docs/
│ └── chat-ui-wireframe.png
├── AGENTS.md
└── CLAUDE.md

## UI 설계 참조

- 와이어프레임: ./docs/chat-ui-wireframe.png
- 컴포넌트 ID 매핑:
  - A: Header (로고, 세션 제목)
  - B: Sidebar (새 대화, 세션 목록)
  - C: ChatArea (D+E 컨테이너)
  - D: MessageList (사용자/AI 메시지, ToolResultCard, 로딩 상태)
  - E: MessageInput (입력창 + 전송 버튼)
  - F/G: 모바일 Header / MessageList
- 반응형 브레이크포인트: 768px (Sidebar → 햄버거 메뉴)

## 코딩 컨벤션

### 테스트

- TDD 방식으로 개발: 테스트 먼저 작성 (레드 확인 → 최소 구현 → 그린 확인)
- **Backend/Frontend 모두 Vitest**로 통일 (Jest 아님 — 과거 문서에 "Jest"로 기재된 적이 있었으나 폐기된 결정임)
- **Backend (Node.js/Express)**: **Vitest + supertest** 사용. `vitest.config.ts`에서 `environment: 'node'`. 테스트 파일은 `backend/tests/` 하위에 소스 구조를 그대로 미러링해 `*.test.ts`로 작성 (예: `tests/services/session-store.test.ts`)
- **Frontend (React/Vite)**: **Vitest + React Testing Library** 사용. `vite.config.ts`의 `test` 블록에서 `environment: 'jsdom'`. 테스트 파일은 대상 컴포넌트/모듈과 같은 디렉토리에 co-locate해 `*.test.ts(x)`로 작성 (예: `src/components/header/header.test.tsx`)
  - 두 패키지 모두 `test.globals: true` 설정으로 `describe`/`it`/`expect`를 전역 사용
  - `@testing-library/jest-dom` matcher는 frontend `src/test/setup.ts`에서 전역 등록
- Vitest를 선택한 이유: frontend는 Vite 번들러 기반이라 별도 트랜스파일 설정 충돌이 없고, backend도 동일 러너로 통일해 설정/러닝 커맨드 일관성을 확보

### 타입스크립트

- 명시적 타입 선언 사용
- any 타입 사용 금지
- interface 우선 사용 (type은 유니온/인터섹션에만)

### 에러 처리

- 커스텀 에러 클래스 사용
- 에러 메시지는 사용자 친화적으로

### 네이밍

- 변수/함수: camelCase
- 클래스/인터페이스: PascalCase
- 상수: UPPER_SNAKE_CASE
- 파일: kebab-case

## 구현하지 않을 것 (Scope 외)

다음 기능은 이번 프로젝트 범위에 포함되지 않습니다.
관련 코드를 생성하지 마세요.

- 사용자 인증/인가 (로그인, 회원가입)
- 데이터베이스 연동 (세션 기반 메모리 저장 사용)
- 파일 업로드
- 이미지/음성 입력 (멀티모달)
- RAG (검색 증강 생성)
- Tool/함수 호출 결과 UI (와이어프레임의 ToolResultCard 포함) — RAG와 마찬가지로 tool-use 관련 기능은 범위 외

## AWS 설정

- Region: us-east-1
- 모델 ID: global.anthropic.claude-sonnet-4-6
- 개발 시 Haiku 사용 가능: global.anthropic.claude-haiku-4-5-20251001-v1:0

## 설계 결정 사항

- 아키텍처: 3-tier (React → Express → AWS Bedrock)
- 스트리밍 방식: SSE (Server-Sent Events)
- 세션 저장: 인메모리 (데이터베이스 미사용)
- API 스타일: RESTful + SSE 스트리밍
- 에러 메시지: 사용자 응답은 한국어, 내부 로그는 영어

테스트 코드가 명세 역할을 합니다.
테스트 파일을 참조하여 구현 코드를 생성하세요.

## 문서 현행화 규칙

이 문서는 코드베이스와 동기화되어야 합니다.
다음 상황 발생 시 이 문서를 함께 갱신하세요:

1. 이 문서에 명시된 기술 스택/설계 결정과 다른 선택을 했을 때
2. Scope 외 항목으로 명시된 기능을 실제로 구현하게 됐을 때
3. 디렉토리 구조나 아키텍처 패턴이 문서와 달라졌을 때
4. 같은 컨벤션 위반을 2회 이상 지적받았을 때

갱신 시 CHANGELOG 섹션에 날짜와 변경 사유를 기록하세요.

## CHANGELOG

| 날짜       | 변경 내용                                                                  | 사유                                                     |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| 2026-07-09 | Backend 테스트 프레임워크를 Jest → Vitest+supertest로 변경하고 프로젝트를 스캐폴딩 상태로 초기화 (기존 구현 코드/테스트 삭제) | 프론트/백엔드 테스트 러너를 Vitest로 통일하고 TDD를 처음부터 재시작하기 위함 |
| 2026-07-05 | interface 우선 원칙 추가                                                    | 반복 지적 2회 발생                                       |
