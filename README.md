# AI 챗봇

AWS Bedrock의 Claude 모델을 사용하는 웹 기반 AI 챗봇입니다. React 프론트엔드가 Express 백엔드를 거쳐
AWS Bedrock Converse Stream API를 호출하고, 응답을 SSE(Server-Sent Events)로 실시간 스트리밍합니다.

```
React (Vite) → Express → AWS Bedrock (Claude)
```

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| AI | AWS Bedrock (Claude Sonnet 4.6 / 개발용 Haiku 4.5), Converse Stream API |
| 스트리밍 | Server-Sent Events (SSE) |
| 세션 저장 | 인메모리 (`Map`, DB 미사용) |
| 테스트 | Vitest (backend: +supertest, frontend: +React Testing Library) |

세부 설계 결정과 코딩 컨벤션, 구현 범위(Scope)는 [AGENTS.md](./AGENTS.md)를,
기능 목록(FR)별 구현 상태는 [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)를 참고하세요.

## 시작하기

### 요구사항

- Node.js
- AWS 자격 증명 (`~/.aws/credentials` 또는 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` 환경 변수) —
  `bedrock:InvokeModelWithResponseStream` 권한이 있는 계정, 리전 `us-east-1`

### 백엔드 (포트 3000)

```bash
cd backend
npm install
npm run build   # tsc로 dist/ 컴파일
npm start       # node dist/index.js
```

- `PORT` 환경 변수로 포트 변경 가능 (기본 3000)
- 개발 중 빠른 반복 테스트에는 `AGENTS.md`에 명시된 Haiku 모델(`global.anthropic.claude-haiku-4-5-20251001-v1:0`)로
  `backend/src/services/bedrock-service.ts`의 `MODEL_ID`를 임시로 바꿔 사용할 수 있습니다.

### 프론트엔드 (포트 5173)

```bash
cd frontend
npm install
npm run dev
```

- 백엔드 주소는 기본값 `http://localhost:3000`이며, `VITE_API_BASE_URL` 환경 변수로 재정의할 수 있습니다.
- 프론트(5173)와 백엔드(3000)가 서로 다른 오리진이므로 백엔드에 CORS 미들웨어가 활성화되어 있습니다.

## 테스트

```bash
cd backend && npm test    # Vitest + supertest
cd frontend && npm test   # Vitest + React Testing Library
```

## API

| 메서드/경로 | 설명 |
| --- | --- |
| `POST /sessions` | 세션 생성 |
| `GET /sessions` | 세션 목록 조회 (updatedAt 내림차순) |
| `GET /sessions/:id` | 세션 단건 조회 |
| `DELETE /sessions/:id` | 세션 삭제 |
| `POST /sessions/:id/messages/stream` | SSE 스트리밍 채팅 (`event: token` → ... → `event: done`) |

요청/응답 스키마와 SSE 이벤트 형식은 [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)를 참고하세요.

## 구현하지 않은 것 (Scope 외)

사용자 인증, 데이터베이스 연동, 파일 업로드, 이미지/음성 입력, RAG, Tool/함수 호출 결과 UI는
이 프로젝트 범위에 포함되지 않습니다. 자세한 내용은 [AGENTS.md](./AGENTS.md#구현하지-않을-것-scope-외)를 참고하세요.
