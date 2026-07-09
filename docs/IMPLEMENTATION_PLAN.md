# TDD 구현 계획 — AGENTS.md + 와이어프레임 기반 FR 목록

## Context

`AGENTS.md`(기술 스택/스코프/설계 결정)와 `docs/chat-ui-wireframe.png`(A~G 컴포넌트 레이아웃)를 분석해
백엔드 API·프론트엔드 컴포넌트를 FR-ID 단위로 나누고, 의존성 순서(백엔드 API → 프론트 훅 → 컴포넌트)로
TDD 구현 순서를 정한다. 계획 수립 시점 기준 프로젝트는 스캐폴딩(빈 sanity 테스트 1개씩)만 있는 상태였다.

**소스 문서 확인 사항**: 와이어프레임 하단의 "A~G: 8.6.2 컴포넌트 우선순위 표 참조"가 가리키는 문서는
저장소 내에 존재하지 않는다(`git log --all`, 전체 grep으로 확인됨). 따라서 우선순위는 이 문서 대신
컴포넌트 간 실제 의존 관계로 대체 산정했다.

**사용자와 확정한 스코프 경계** (와이어프레임/AGENTS.md만으로는 판단 불가하여 확인함):

- `DELETE /sessions/:id` 포함 (와이어프레임엔 삭제 UI 없지만, 인메모리 세션 관리용으로 API는 미리 확보. 프론트는 API 클라이언트 함수만 추가하고 UI 버튼은 만들지 않음)
- 논스트리밍 `POST /sessions/:id/messages`는 **포함하지 않음** (와이어프레임은 스트리밍 응답만 존재, 실사용 경로가 아닌 엔드포인트는 만들지 않음)
- ToolResultCard/tool-use는 기존에 스코프 외로 확정됨(`AGENTS.md` "구현하지 않을 것" 참조) — 이번 목록에도 미포함

**상태 범례**: ⬜ 미착수 · 🟡 진행중 · ✅ 완료

---

## 1. 백엔드 API 엔드포인트 (FR-BE)

| 상태 | FR-ID     | 메서드/경로                          | 요청                            | 응답                                     | 설명                       |
| ---- | --------- | ------------------------------------ | ------------------------------- | ---------------------------------------- | -------------------------- |
| ✅   | FR-BE-001 | `POST /sessions`                     | body 없음                       | `201 Session`                            | 세션 생성                  |
| ✅   | FR-BE-002 | `GET /sessions/:id`                  | -                               | `200 Session` \| `404 {error}`           | 세션 단건 조회             |
| ✅   | FR-BE-003 | `DELETE /sessions/:id`               | -                               | `204` \| `404 {error}`                   | 세션 삭제                  |
| ✅   | FR-BE-004 | `GET /sessions`                      | -                               | `200 Session[]` (updatedAt 내림차순)     | 세션 목록 조회 (Sidebar용) |
| ✅   | FR-BE-005 | `POST /sessions/:id/messages/stream` | `{role:'user', content:string}` | SSE: `token`→...→`done`, 실패 시 `error` | 스트리밍 채팅              |

**스키마**

```ts
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
interface Session {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// FR-BE-005 SSE 이벤트
// event: token  data: { delta: string }          (0회 이상, contentBlockDelta마다)
// event: done   data: { message: ChatMessage; stopReason: string }
// event: error  data: { message: string }         (스트림 시작 후 실패 시. 시작 전 검증/조회 실패는 일반 400/404 JSON)
```

**내부 구현 단위** (엔드포인트는 아니지만 FR-BE-005의 선행 작업으로 각자 단위 테스트 보유):

- `SessionStore` (인메모리 `Map`): create/get/delete/list/addMessage — FR-BE-001~004가 각각 필요한 메서드를 하나씩 추가
- `BedrockService.converseStream()`: AWS SDK `ConverseStreamCommand` 래핑, `BedrockStreamEvent` 매핑 — FR-BE-005 전용 선행 작업

---

## 2. 프론트엔드 (FR-FE) — 와이어프레임 A~G 매핑

| 상태 | FR-ID     | 계층           | 대상                                          | 와이어프레임 매핑                                     | 의존                    |
| ---- | --------- | -------------- | --------------------------------------------- | ----------------------------------------------------- | ----------------------- |
| ✅   | FR-FE-001 | API 클라이언트 | `api/session-api.ts` (create/get/delete/list) | -                                                     | FR-BE-001~004           |
| ⬜   | FR-FE-002 | API 클라이언트 | `api/chat-stream.ts` (SSE 파서)               | -                                                     | FR-BE-005               |
| ⬜   | FR-FE-003 | 훅             | `useSessions` (목록 로드/생성/선택)           | -                                                     | FR-FE-001               |
| ⬜   | FR-FE-004 | 훅             | `useChatStream` (전송/스트리밍 상태)          | -                                                     | FR-FE-002               |
| ⬜   | FR-FE-005 | 컴포넌트       | `MessageInput`                                | **E**: 입력창 + 전송 버튼                             | -                       |
| ⬜   | FR-FE-006 | 컴포넌트       | `MessageList`                                 | **D/G**: 메시지 목록, 로딩 상태 (ToolResultCard 제외) | -                       |
| ⬜   | FR-FE-007 | 컴포넌트       | `Sidebar`                                     | **B**: 새 대화, 세션 목록                             | -                       |
| ⬜   | FR-FE-008 | 컴포넌트       | `Header`                                      | **A/F**: 로고/제목, 모바일 햄버거                     | -                       |
| ⬜   | FR-FE-009 | 컴포넌트       | `ChatArea`                                    | **C**: D+E 컨테이너                                   | FR-FE-005, 006          |
| ⬜   | FR-FE-010 | 통합           | `App`                                         | 전체 조합 (A+B+C), 768px 반응형 사이드바 토글         | FR-FE-003, 004, 007~009 |

컴포넌트 자체(005~009)는 props/콜백만으로 격리 테스트하므로 훅(003/004)과 병렬로 만들 수 있지만,
**App(010)에서 실제로 합쳐지는 시점에는 반드시 훅이 먼저 완성**되어 있어야 하므로 최종 정렬 순서에서는 뒤에 둔다.

---

## 3. 구현 순서 (의존성 기준)

1. FR-BE-001 → 002 → 003 → 004 → 005 (백엔드, `SessionStore` 메서드를 하나씩 추가하며 CRUD 완성 후 스트리밍)
2. FR-FE-001, FR-FE-002 (API 클라이언트, 병렬 가능 — 각각 FR-BE 그룹에만 의존)
3. FR-FE-003, FR-FE-004 (훅, 각각 001/002에만 의존 — 병렬 가능)
4. FR-FE-005, 006, 007, 008 (leaf 컴포넌트, 서로 의존 없음 — 병렬 가능, props 기반이라 훅 완성 전에도 착수 가능)
5. FR-FE-009 (005+006 조합)
6. FR-FE-010 (전체 통합 — 003/004/007/008/009 모두 필요)

---

## 4. 테스트 시나리오 개요 (케이스명 수준)

**FR-BE-001 `POST /sessions`**

- `SessionStore.create()`: uuid v4 형식 id와 빈 messages 배열을 가진 세션을 생성한다 / 호출마다 다른 id를 생성한다
- 라우터: 새 세션을 생성하고 201로 응답한다

**FR-BE-002 `GET /sessions/:id`**

- `SessionStore.get()`: 존재하는 세션을 반환한다 / 존재하지 않으면 SessionNotFoundError
- 라우터: 존재하는 세션을 200으로 반환한다 / 존재하지 않는 세션은 404 + 한국어 에러 메시지

**FR-BE-003 `DELETE /sessions/:id`**

- `SessionStore.delete()`: 삭제 후 조회 시 SessionNotFoundError / 존재하지 않는 id 삭제 시 에러
- 라우터: 세션을 삭제하고 204 반환 / 존재하지 않는 세션 삭제 시 404

**FR-BE-004 `GET /sessions`**

- `SessionStore.list()`: 세션 없으면 빈 배열 / 생성된 모든 세션 반환 / updatedAt 내림차순 정렬
- 라우터: 세션 목록을 반환한다 / 세션 없으면 빈 배열 반환

**FR-BE-005 `POST /sessions/:id/messages/stream`**

- `BedrockService.converseStream()`: Converse Stream API 형식으로 요청 변환 / 이벤트를 순서대로 yield / 요청 실패 시 BedrockApiError
- 라우터: text/event-stream으로 응답 / 델타를 event: token으로 순서대로 전송 / 종료 시 event: done + 최종 메시지 / 완료 후 세션에 assistant 메시지 저장 / content 없으면 400 / 존재하지 않는 세션이면 404 / Bedrock 에러 시 event: error 전송

**FR-FE-001 `session-api`**

- createSession: POST /sessions 호출 후 생성된 세션 반환
- getSession / listSessions / deleteSession: 각각 올바른 메서드·경로로 호출하고 결과 반환

**FR-FE-002 `chat-stream`**

- 세션 id/content로 스트림 엔드포인트에 POST 요청을 보낸다
- token 이벤트를 순서대로 onToken에 전달한다
- done 이벤트가 오면 onDone을 message/stopReason과 호출한다
- error 이벤트가 오면 onError를 호출한다
- 이벤트가 여러 청크로 쪼개져 와도 올바르게 파싱한다

**FR-FE-003 `useSessions`**

- 마운트 시 세션 목록을 로드한다
- 새 세션 생성 시 목록 맨 앞에 추가되고 활성 세션으로 선택된다
- 세션을 선택하면 activeSessionId가 갱신된다

**FR-FE-004 `useChatStream`**

- 전송 시 사용자 메시지를 낙관적으로 즉시 추가한다
- 토큰 수신마다 streamingText가 누적된다
- 완료 시 assistant 메시지가 추가되고 isStreaming이 false로 복귀한다
- 에러 발생 시 isStreaming이 정리된다

**FR-FE-005 `MessageInput`**

- 입력 후 전송 클릭 시 onSend 호출 / 전송 후 입력창 비움 / 빈 값이면 전송 버튼 비활성화 / Enter로 전송 / disabled prop 시 입력창·버튼 비활성화

**FR-FE-006 `MessageList`**

- 메시지를 순서대로 렌더링 / role별 data-role 부여 / 스트리밍 중 델타 없으면 "응답 생성 중..." + 로딩 표시 / 델타 도착 시 누적 텍스트 표시

**FR-FE-007 `Sidebar`**

- 세션 목록 렌더링 / "+ 새 대화" 클릭 시 onNewSession 호출 / 세션 클릭 시 onSelectSession(id) 호출 / activeSessionId와 일치하는 항목에 active 표시

**FR-FE-008 `Header`**

- 제목 렌더링 / 햄버거 클릭 시 onToggleSidebar 호출

**FR-FE-009 `ChatArea`**

- MessageList+MessageInput 함께 렌더링 / 메시지 전송 시 onSend 호출 / 스트리밍 중 입력창 비활성화

**FR-FE-010 `App` (통합)**

- 새 대화 생성 후 메시지 전송 시 스트리밍 응답이 렌더링된다
- 세션을 선택하면 해당 세션의 메시지 히스토리가 표시된다
- 모바일 폭(≤768px)에서 햄버거 클릭 시 사이드바가 토글된다

---

## 5. Scope 외 항목 자가 검증

| 제외 항목 (AGENTS.md)      | 이번 FR 목록에 포함 여부                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| 사용자 인증/인가           | 없음 — 세션은 UUID 발급만, 로그인/회원가입 API·화면 없음                                    |
| 데이터베이스 연동          | 없음 — `SessionStore`는 인메모리 `Map` 유지, DB 클라이언트/스키마 없음                      |
| 파일 업로드                | 없음 — `MessageInput`은 텍스트 입력만, multipart/파일 API 없음                              |
| 이미지/음성 입력(멀티모달) | 없음 — `ChatMessage.content`는 `string` 고정, Converse 요청도 텍스트 블록만 사용            |
| RAG                        | 없음 — `BedrockService`는 Converse/ConverseStream만 호출, 벡터DB/검색 연동 없음             |
| Tool-use/ToolResultCard    | 없음 — `MessageList`(FR-FE-006)에 명시적으로 미포함, AGENTS.md 구현하지 않을 것 목록과 일치 |

## 검증 방법

- 각 FR은 "실패하는 테스트 작성 → 레드 확인 → 최소 구현 → 그린 확인" TDD 사이클로 진행
- 백엔드: `cd backend && npm test` (Vitest+supertest), `npx tsc --noEmit`
- 프론트: `cd frontend && npm test` (Vitest+RTL), `npx tsc -b`
- FR-BE-005, FR-FE-010 완료 시점에 실제 서버 기동 + 브라우저(Playwright)로 새 대화 생성→메시지 전송→스트리밍 렌더링 수동 확인 후 서버 종료

## 진행 상태 갱신 규칙

FR을 착수/완료할 때 이 문서의 상태 컬럼(⬜/🟡/✅)을 함께 갱신한다. 레드 테스트 작성 시작 시 🟡, 그린 확인 후 ✅로 변경.
