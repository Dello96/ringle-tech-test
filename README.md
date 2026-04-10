# Ringle AI English Tutor

멤버십 기반 AI 영어 회화 튜터 웹 애플리케이션.
OpenAI 실제 연동 (GPT-4o-mini LLM, Whisper STT, TTS-1)을 사용하며, 결제는 Mock 처리합니다.

## Quick Start

### Prerequisites

- Ruby 3.3+ / Rails 8.1
- Node.js 20+ / npm
- PostgreSQL 14+
- OpenAI API key (없으면 FakeClient 데모 모드로 동작)

### 1. Backend Setup

```bash
cd backend
bundle install
bin/rails db:create db:migrate db:seed
```

OpenAI 연동을 위해 `.env` 파일에 API 키를 설정합니다:

```bash
cp .env.example .env
# .env 파일에 OPENAI_API_KEY=your-key-here 입력
```

키 없이도 앱은 **데모 모드**(Ai::FakeClient)로 동작합니다.

```bash
bin/rails server  # http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

Vite dev server가 `/api/*` 요청을 Rails 백엔드로 자동 프록시합니다.

### 3. Demo Accounts

시드 데이터로 생성되는 기본 계정:

| Role  | Email             | Password    |
| ----- | ----------------- | ----------- |
| Admin | admin@example.com | password123 |
| User  | user@example.com  | password123 |

새 계정을 직접 생성할 수도 있으며, 관리자 가입 시 관리자 코드 `0000`을 입력합니다.

### 4. Running Tests

```bash
cd backend
bundle exec rspec   # 155 examples, 0 failures
```

---

## Suggested Demo Flow

1. 데모 유저로 로그인
2. Home에서 현재 멤버십 상태 및 만료일 확인
3. Plans에서 플랜 구매 또는 플랜 변경 (변경 시 확인 모달 + 환불 불가 안내)
4. Conversations에서 주제 선택 → AI가 먼저 인사
5. 마이크로 녹음 → 정지 → 미리듣기 → 전송 확인
6. STT → AI 응답 → TTS 자동 재생 확인
7. 유저/AI 양쪽 오디오 재생/정지
8. 관리자로 로그인 → Admin에서 유저 멤버십 부여/변경/삭제

---

## Architecture

```
frontend/  (Vite + React 19 + TypeScript + Tailwind CSS v4)
├── src/api/         API client (fetch wrapper, 토큰, 타임아웃, 401 자동 로그아웃)
├── src/context/     AuthContext (login/register/logout/refresh)
├── src/hooks/       useAudioRecorder (MediaRecorder + AnalyserNode + VAD)
├── src/pages/       Login, Register, Home, Plans, Conversations, Admin, Stubs
└── src/components/  Layout (nav + Outlet)

backend/   (Rails 8.1 API + PostgreSQL)
├── app/models/           User, MembershipPlan, UserMembership, Conversation, Message
├── app/controllers/api/  Auth, Plans, Purchases, Conversations, Messages,
│                         Admin::Users, Admin::Memberships
├── app/services/         ConversationService, PurchaseService, MockPaymentGateway,
│                         Ai::Client, Ai::FakeClient
└── spec/                 16 spec files (model, request, service)
```

### Tech Stack Rationale

| Choice                          | Why                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `has_secure_token` (not JWT)    | DB-backed 토큰으로 무효화가 간단. 리프레시/만료 관리 불필요.                        |
| `Ai::Client` / `Ai::FakeClient` | DI 패턴. `OPENAI_API_KEY` 유무로 실제/모의 클라이언트 자동 전환.                    |
| `MockPaymentGateway` with DI    | `PurchaseService.new(gateway:)` — 비즈니스 로직 변경 없이 게이트웨이 교체.          |
| PostgreSQL array for `features` | Join 테이블 없이 `%w[learning conversation analysis]` 기능 체크.                    |
| `ActiveStorage` proxy mode      | Rails 프록시를 통한 오디오 서빙으로 CORS 문제 회피.                                 |
| Tailwind CSS v4                 | 유틸리티 기반, Ringle 스타일 라이트 테마, `@tailwindcss/vite` 플러그인 zero-config. |
| TanStack Query                  | 서버 상태 캐싱, 자동 리페치, 대화 메시지 낙관적 업데이트.                           |

### Domain Model

```
User (has_secure_password, has_secure_token :auth_token)
  ├── has_many :user_memberships
  │     └── belongs_to :membership_plan (features[], duration_days, price_cents)
  └── has_many :conversations
        └── has_many :messages (role enum, content, has_one_attached :audio)
```

### API Endpoints

| Method | Endpoint                           | Auth      | Purpose                               |
| ------ | ---------------------------------- | --------- | ------------------------------------- |
| POST   | /api/v1/auth/register              | -         | 회원가입 (관리자: admin_code 필요)    |
| POST   | /api/v1/auth/login                 | -         | 로그인                                |
| GET    | /api/v1/auth/me                    | User      | 현재 유저 + 활성 멤버십               |
| GET    | /api/v1/plans                      | -         | 멤버십 플랜 목록                      |
| POST   | /api/v1/purchases                  | User      | 플랜 구매 (mock 결제, 플랜 변경 지원) |
| GET    | /api/v1/conversations              | User+conv | 대화 목록                             |
| GET    | /api/v1/conversations/:id          | User+conv | 대화 상세 + 메시지                    |
| POST   | /api/v1/conversations              | User+conv | 대화 시작 (AI 먼저 발화)              |
| POST   | /api/v1/conversations/:id/messages | User+conv | 메시지 전송 (텍스트 or 오디오)        |
| GET    | /api/v1/admin/users                | Admin     | 유저 목록 + 멤버십 상태               |
| GET    | /api/v1/admin/memberships          | Admin     | 멤버십 목록 (필터 지원)               |
| POST   | /api/v1/admin/memberships          | Admin     | 유저에게 멤버십 부여                  |
| PATCH  | /api/v1/admin/memberships/:id      | Admin     | 멤버십 플랜 변경                      |
| DELETE | /api/v1/admin/memberships/:id      | Admin     | 멤버십 삭제                           |

### Conversation Flow

1. 주제 선택 → `POST /conversations` → 시스템 프롬프트 + AI 첫 메시지(TTS 오디오 포함) 생성
2. 유저가 텍스트 또는 오디오 녹음 → 미리듣기로 확인 → `POST /conversations/:id/messages`
3. 백엔드: 오디오 → Whisper STT → GPT-4o-mini (최근 10개 메시지 + 턴 기반 시스템 프롬프트) → TTS-1 mp3
4. 프론트: 낙관적 메시지 추가, AI 오디오 자동 재생, 녹음 중 실시간 볼륨 시각화

### Abuse Prevention

| Layer      | Mechanism                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| 프론트엔드 | 최소 녹음 1초 / 최대 60초, 전송 후 3초 쿨다운, 메시지 잔여 횟수 표시       |
| 백엔드     | 분당 유저 메시지 10회 제한, 일일 대화 생성 10회 제한, 오디오 파일 5MB 제한 |
| 대화당     | 최대 20개 메시지                                                           |

### Audio / VAD

- `MediaRecorder` + `AudioContext`/`AnalyserNode`로 실시간 볼륨 시각화
- 에너지 기반 VAD로 녹음 앞뒤 무음 구간 자동 제거 (WebM 헤더 chunk 0 보존)
- 녹음 품질 옵션: `channelCount: 1`, `echoCancellation`, `noiseSuppression`, `autoGainControl`
- 녹음 완료 후 미리듣기 → 확인 전송 → AI 응답 TTS 자동 재생

### Network Resilience

- `AbortController` 기반 30초 타임아웃
- 네트워크 오류/타임아웃 시 사용자 친화적 에러 메시지
- 401 응답 시 토큰 자동 삭제 + 로그아웃

### Testing Strategy

- **Model specs**: 검증, 연관관계, 비즈니스 로직 (active?, has_feature?, remaining_days)
- **Service specs**: PurchaseService (성공/거절/DI), ConversationService (시작/응답/한도), MockPaymentGateway, Ai::Client (WebMock), Ai::FakeClient
- **Request specs**: 모든 API 엔드포인트에 대한 인증/인가 엣지 케이스 (401, 403, 404, 422)
- **WebMock**: 테스트 환경에서 모든 외부 HTTP 호출 차단
- **FactoryBot + Shoulda Matchers**: 일관된 테스트 데이터 + 선언적 매처

---

## Documentation

- `docs/coding_agent_interaction_history.md` — AI 도구 활용 개발 기록 (프롬프트, 생성 코드, 수정/검증 과정)
- `docs/coding_agent_prompt_history.md` — AI 도구에 전달한 프롬프트 이력
- `docs/*.png` — 개발 과정 스크린샷
