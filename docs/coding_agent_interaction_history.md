# Coding Agent Interaction History

AI 도구(Cursor)를 활용한 개발 과정 기록.

---

## Phase 1: Backend 기반 설정 + 인증

**날짜:** 2026-04-08

### 1-1. 설계 및 리뷰 (코드 작성 전)

**프롬프트 요약:**
1. 과제 요구사항을 바탕으로 전체 구현 체크리스트, 아키텍처, 도메인 모델, API, 페이지 구조, 구현 순서 제안을 요청
2. 제안된 설계에 대해 staff-level reviewer 관점의 비판적 리뷰 요청 (요구사항 커버리지, 도메인 모델, 테스트 전략 등 11개 항목)
3. P0 이슈 수정 후 간소화 요청
4. 채용 리뷰어 관점에서 20개 까다로운 질문 + 솔직한 답변 요청
5. 최종 통합 설계 문서 요청
6. 최종 설계에 대한 자기 검토 요청

**AI 출력 중 채택한 것:**
- 도메인 모델 5개 (User, MembershipPlan, UserMembership, Payment, Conversation, Message)
- JWT 대신 `has_secure_token` 사용 결정 — AI가 JWT의 복잡도 (리프레시, 만료, 저장 위치)를 지적하여 간소화
- AI 통합을 단일 클라이언트 (Ai::Client / Ai::FakeClient)로 통합 — 3개 어댑터에서 간소화
- VAD를 ML 라이브러리 대신 Web Audio API 에너지 기반 트림으로 변경 — 외부 의존성 제거

**AI 출력 중 수정/보완한 것:**
- `UserMembership.status` enum에서 `expired` 제거 — AI 리뷰에서 P0으로 지적, `expires_at` 계산값으로 변경
- 구현 순서 변경 — 대화 기능을 Phase 3으로 앞당김 (가장 인상적인 기능이 시간 부족으로 누락되는 위험 방지)
- PurchaseService에 트랜잭션 보호 추가 — AI 자기 검토에서 발견

**검증 방법:** 5차례의 설계-리뷰 반복을 통해 요구사항 커버리지, 도메인 모델 정합성, 실현 가능성 검증

### 1-2. Sub-Phase 1a: 프로젝트 기반 설정

**프롬프트:** "Sub-Phase 1a를 시작합니다" (사전에 합의된 범위 내에서 구현)

**AI가 생성한 것:**
- Gemfile 수정 (bcrypt, rack-cors, ruby-openai, rspec-rails, factory_bot_rails, shoulda-matchers, webmock, faker)
- RSpec 초기화 + rails_helper 커스터마이즈 (FactoryBot, Shoulda, WebMock 통합)
- CORS initializer (API + ActiveStorage 경로)
- AI client initializer (OPENAI_API_KEY 유무 기반 전환)
- application.rb 수정 (UTC, ActiveStorage proxy, generator 설정)
- ActiveStorage 마이그레이션 실행

**수정한 것:**
- `.gitignore`에서 `.env.example`이 무시되는 문제 발견 → 예외 규칙 추가

**검증:** `bundle exec rspec` → 0 examples, 0 failures / `rails db:migrate` 성공

### 1-3. Sub-Phase 1b: User 모델

**AI가 생성한 것:**
- CreateUsers 마이그레이션, User 모델, factory, model spec (14개)

**수정한 것:**
- AI가 `has_many :user_memberships`와 `active_membership`, `has_feature?`를 포함했으나, UserMembership 모델이 아직 없어서 테스트 실패 → 해당 코드를 제거하고 Phase 2로 연기
- 주석으로 Phase 2에서 추가할 내용 명시

**검증:** `bundle exec rspec spec/models/user_spec.rb` → 14 examples, 0 failures

### 1-4. Sub-Phase 1c: Base Controller

**AI가 생성한 것:**
- `Api::V1::BaseController` (ActionController::API 상속, authenticate!, require_admin!, require_feature!, rescue_from)
- routes.rb에 API 네임스페이스 구조

**수정한 것:** 없음. 깔끔하게 생성됨.

**검증:** `bin/rails routes` 정상 로드, 전체 테스트 통과

### 1-5. Sub-Phase 1d: Auth Controller + Request Spec

**AI가 생성한 것:**
- AuthController (register, login, me)
- auth routes 3개
- request spec 11개

**AI가 실수한 것:**
- login 메서드에서 `User.normalizes_value_for(:email, ...)` 사용 → Rails 8.1에서 해당 메서드가 존재하지 않아 4개 테스트 실패
- `params[:email].to_s.strip.downcase`로 직접 정규화하는 방식으로 수정

**검증:** `bundle exec rspec` → 25 examples, 0 failures

### 1-6. Sub-Phase 1e: 시드 데이터 + 정리

**AI가 생성한 것:**
- db/seeds.rb (Admin + User 계정, find_or_create_by로 멱등성 보장)
- 이 문서 (coding_agent_interaction_history.md)
- Minitest test/ 디렉토리 삭제

**검증:** `rails db:seed` 2회 실행 → 멱등성 확인

---

## Phase 2: 멤버십 도메인 + 결제 + Admin API

**날짜:** 2026-04-08

### 2-1. Sub-Phase 2a: MembershipPlan + UserMembership 모델

**AI가 생성한 것:**
- CreateMembershipPlans 마이그레이션 (PG 배열 `features`, NOT NULL 제약)
- CreateUserMemberships 마이그레이션 (FK, `[user_id, expires_at]` 복합 인덱스)
- MembershipPlan 모델 (VALID_FEATURES 상수, features 유효성 검증, `has_feature?`, `as_json`)
- UserMembership 모델 (`active?`, `expired?`, `remaining_days`, `active` scope, 중첩 `as_json`)
- User 모델 업데이트 (stub → `has_many :user_memberships`, 실제 `active_membership`/`has_feature?`)
- Factory 3개 (membership_plan, user_membership + traits)
- 모델 스펙 3개 파일

**수정한 것:** 없음.

**검증:** `bundle exec rspec` → 67 examples, 0 failures

### 2-2. Sub-Phase 2b: Plans API + Admin Memberships API

**AI가 생성한 것:**
- `PlansController#index` (공개 API, 인증 불필요)
- `Admin::MembershipsController` (index/create/destroy, `require_admin!`, user_id/status 필터)
- routes 추가 (`resources :plans`, `namespace :admin { resources :memberships }`, `resources :purchases`)
- request spec 18개 (Plans 4개, Admin Memberships 14개)

**수정한 것:** 없음.

**검증:** `bundle exec rspec` → 18 examples, 0 failures (2b 단독)

### 2-3. Sub-Phase 2c: Payment + PurchaseService + Purchase API

**AI가 생성한 것:**
- `MockPaymentGateway` (Struct::Result, 성공/카드 거절/금액 오류 시뮬레이션)
- `PurchaseService` (gateway DI, 트랜잭션 원자성, PurchaseError 예외)
- `PurchasesController#create` (plan 조회 → 결제 → 201 응답, 실패 시 402)
- 서비스 스펙 2개 + request spec 1개 (총 16개)

**AI가 실수한 것:**
- `freeze_time` 헬퍼가 RSpec에 포함되지 않아 2개 테스트 실패 → `rails_helper.rb`에 `ActiveSupport::Testing::TimeHelpers` include 추가
- `not_change` 메서드 미존재 → `rescue nil` + `not_to change` 패턴으로 분리

**검증:** 수정 후 `bundle exec rspec` → 16 examples, 0 failures (2c 단독)

### 2-4. Sub-Phase 2d: /auth/me 통합 + 시드 + 문서

**AI가 생성한 것:**
- AuthController#me 수정 (nil → `current_user.active_membership&.as_json`)
- Auth spec에 멤버십 관련 테스트 3개 추가 (활성/만료/없음)
- db/seeds.rb 확장 (Basic/Standard/Premium 3개 플랜, demo user에 Premium 멤버십 부여)
- 이 문서 업데이트

**수정한 것:** 없음.

**검증:**
- `bundle exec rspec spec/requests/api/v1/auth_spec.rb` → 14 examples, 0 failures
- `rails db:seed` 2회 실행 → 멱등성 확인

---

## Phase 3: AI 대화 시스템

**날짜:** 2026-04-08

### 3-1. Sub-Phase 3a: Ai::Client + Ai::FakeClient

**AI가 생성한 것:**
- `Ai::FakeClient` (chat: 사용자 메시지 에코 + 랜덤 응답, transcribe: 고정 문자열, synthesize: WAV silence 생성)
- `Ai::Client` (ruby-openai gem 기반. GPT-4o-mini chat, Whisper STT, TTS-1 nova voice)
- 스펙 9개 (FakeClient 6개, Client 3개 — WebMock으로 OpenAI API 모킹)

**수정한 것:** 없음.

**검증:** `bundle exec rspec spec/services/ai/` → 9 examples, 0 failures

### 3-2. Sub-Phase 3b: Conversation + Message 모델

**AI가 생성한 것:**
- CreateConversations 마이그레이션 (topic NOT NULL, messages_count counter cache)
- CreateMessages 마이그레이션 (role NOT NULL, FK)
- Conversation 모델 (TOPICS 상수 8개, MAX_MESSAGES=20, `message_limit_reached?`)
- Message 모델 (role enum user/assistant/system, ActiveStorage audio 첨부, `audio_url` 프록시 경로)
- User에 `has_many :conversations` 추가
- Factory + 모델 스펙 16개

**수정한 것:** 없음.

**검증:** `bundle exec rspec spec/models/conversation_spec.rb spec/models/message_spec.rb` → 16 examples, 0 failures

### 3-3. Sub-Phase 3c: ConversationService

**AI가 생성한 것:**
- `ConversationService` (start_conversation: system prompt 생성→AI chat→TTS→저장, reply: STT→history build→chat→TTS→저장)
- SYSTEM_PROMPT 설계 (6가지 지침: 주제 유지, 간결한 영어, 문법 교정, 후속 질문, 격려)
- 대화 이력 제한 (최근 10개 메시지만 전달 — 토큰 관리)
- AI 클라이언트 DI 패턴 (테스트에서 FakeClient 주입)
- 스펙 11개

**수정한 것:** 없음.

**검증:** `bundle exec rspec spec/services/conversation_service_spec.rb` → 11 examples, 0 failures

### 3-4. Sub-Phase 3d: Conversations/Messages API

**AI가 생성한 것:**
- `ConversationsController` (index/show/create, `require_feature!("conversation")` 권한 체크)
- `MessagesController` (create, message limit 체크, 텍스트/오디오 입력 지원)
- 라우트: `resources :conversations { resources :messages, only: :create }`
- Request spec 15개

**AI가 실수한 것:**
- Messages spec에서 `conversation` lazy let이 멤버십도 함께 생성하는 구조 → "다른 사용자 대화" 테스트에서 `conversation`을 참조하지 않아 `user`에게 멤버십 미생성 → 403 대신 404 기대하여 실패
- `before` 블록으로 멤버십 생성을 분리하여 수정

**검증:** 수정 후 15 examples, 0 failures

---

## Phase 4: Frontend (React + TypeScript)

**날짜:** 2026-04-08

### 4-1. Sub-Phase 4a: 의존성 + 프로젝트 구조

**AI가 생성한 것:**
- Vite + React 프로젝트에 `react-router-dom`, `@tanstack/react-query`, `tailwindcss`, `@tailwindcss/vite` 추가
- `vite.config.ts`: Tailwind 플러그인 + API 프록시 (`/api` → localhost:3000, `/rails` → localhost:3000)
- `src/index.css`: Tailwind import + 커스텀 다크 테마 CSS 변수
- `src/types/index.ts`: 모든 도메인 모델에 대한 TypeScript 인터페이스 (User, MembershipPlan, UserMembership, Conversation, Message, AuthResponse, MeResponse, AdminMembership)
- `src/api/client.ts`: fetch 래퍼 (토큰 관리, JSON/FormData 분기, ApiError 클래스), 구조화된 API 메서드 (auth, plans, purchases, conversations, messages, admin)
- `src/context/AuthContext.tsx`: React Context (login, register, logout, refresh + 전역 user/membership 상태)

**수정한 것:** 없음.

**검증:** `npm run build` → 타입 에러 없이 성공

### 4-2. Sub-Phase 4b: Auth 페이지 + Layout

**AI가 생성한 것:**
- `Layout.tsx`: 네비게이션 바 (Home, Plans, Conversations, 조건부 Admin 링크), 유저 정보, 로그아웃 버튼, Outlet
- `LoginPage.tsx`: 이메일/비밀번호 폼, 에러 표시, `useAuth().login`, 성공 시 홈 이동
- `RegisterPage.tsx`: 이름/이메일/비밀번호 폼, 에러 표시, `useAuth().register`, 성공 시 홈 이동
- `App.tsx`: BrowserRouter, QueryClientProvider, AuthProvider 통합. PrivateRoute/AdminRoute/GuestRoute 라우트 가드. 전체 라우트 정의.
- `index.html`: 타이틀 "AI English Tutor"로 변경

**수정한 것:** 없음.

**검증:** `npm run build` → 성공

### 4-3. Sub-Phase 4c: Home + Plans + Purchase 페이지

**AI가 생성한 것:**
- `HomePage.tsx`: 유저 대시보드 (이름, 멤버십 상태, 남은 일수, 기능 접근 카드 3개 — Learning/Conversation/Analysis)
- `PlansPage.tsx`: 플랜 목록 (TanStack Query), 현재 멤버십 표시, 모의 결제 (card_token mock)

**수정한 것:** 없음.

**검증:** `npm run build` → 성공

### 4-4. Sub-Phase 4d: Conversation 페이지 (대화 UI + 오디오 UX)

**AI가 생성한 것:**
- `useAudioRecorder.ts`: 커스텀 훅 (MediaRecorder + AudioContext/AnalyserNode 실시간 볼륨 시각화, startRecording/stopRecording)
- `ConversationListPage.tsx`: 주제 선택 그리드 (8개 토픽), 과거 대화 목록, conversation 기능 가드
- `ConversationPage.tsx`: 채팅 UI (메시지 버블, AI/User 구분), 텍스트/음성 입력 토글, 녹음 볼륨 바, AI 오디오 재생, "AI is thinking" 로딩, 메시지 제한 처리

**수정한 것:** 없음.

**검증:** `npm run build` → 성공

### 4-5. Sub-Phase 4e: Admin 페이지 + Stubs + 최종 검증

**AI가 생성한 것:**
- `AdminPage.tsx`: 멤버십 관리 테이블 (필터, 할당, 취소), 유저/플랜 ID 입력
- `FeatureStubPage.tsx`: Learning/Analysis "coming soon" 스텁 페이지 (기능 접근 메시지 조건부 표시)

**AI가 실수한 것:**
- `TS1294`: ApiError 생성자에서 `public status: number` 단축 구문 사용 → `erasableSyntaxOnly` 설정과 충돌. 명시적 프로퍼티 선언으로 수정.
- `TS18047`: FeatureStubPage에서 `membership.plan.name`이 null일 수 있는 경우 미처리 → `membership?.plan.name` 옵셔널 체이닝 추가.

**검증:** 수정 후 `npm run build` → 성공

---

## Post-Phase: 제출 준비 수정

**날짜:** 2026-04-08

**리뷰 요약:** 전체 구현 상태에 대한 strict reviewer 관점 갭 분석 수행

**수정 항목:**
1. `.env.example`에서 실제 API 키 제거 (보안)
2. 프로젝트 루트 `README.md` 작성 (아키텍처, 실행법, 테스트, API 엔드포인트 문서)
3. `ConversationPage` 에러 핸들링 추가 (silent catch → 에러 메시지 표시)
4. AI 첫 발화 오디오 자동재생 구현 (대화 진입 시 자동 재생)
5. `ConversationListPage` 대화 생성 실패 에러 표시
6. 마이크 권한 거부 에러 핸들링 추가
7. 이 문서에 Phase 4 + Post-Phase 기록 추가
