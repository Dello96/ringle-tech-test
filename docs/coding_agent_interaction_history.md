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

## Post-Phase: 제출 준비 수정 (1차)

**날짜:** 2026-04-08

**프롬프트 요약:** 전체 구현 상태에 대한 strict product/engineering reviewer 관점 갭 분석 요청. "즉시 수정할 것들을 먼저 수정해줘"

**수정 항목:**
1. `.env.example`에서 실제 API 키 제거 (보안)
2. 프로젝트 루트 `README.md` 작성 (아키텍처, 실행법, 테스트, API 엔드포인트 문서)
3. `ConversationPage` 에러 핸들링 추가 (silent catch → 에러 메시지 표시)
4. AI 첫 발화 오디오 자동재생 구현 (대화 진입 시 자동 재생)
5. `ConversationListPage` 대화 생성 실패 에러 표시
6. 마이크 권한 거부 에러 핸들링 추가

**검증:** `npm run build` 성공, 브라우저 수동 테스트

---

## Phase 5: 오디오 녹음/재생 버그 수정

**날짜:** 2026-04-08

### 5-1. 유저 오디오 재생 실패 (500 에러) + STT 400 에러

**프롬프트 요약:**
1. "음성인식을 정상적으로 하지 못함 / 녹음한 내용을 들을 수 없음 / AI가 알아듣지 못함"
2. "녹음한 소리를 들으려고 play audio를 눌러도 듣지 못함"
3. "녹음 후 정지버튼을 눌렀을 때 422 에러 발생"

**원인 분석:**
- `trimSilence`에서 chunk 0(WebM 헤더/코덱 초기화 데이터)을 제거하면 브라우저와 OpenAI 모두 파일을 읽지 못함
- ActiveStorage에 저장되는 유저 오디오가 `rewind` 없이 빈 파일로 저장됨
- OpenAI STT에 전달되는 파일이 `rewind` 되지 않아 빈 데이터 전송

**AI가 생성한 것:**
- `trimSilence` 수정: chunk 0(WebM 헤더)을 항상 포함하도록 변경. 앞뒤 무음 제거 시 `chunks[0]`은 반드시 보존
- `useAudioRecorder.ts`에 `getUserMedia` 품질 옵션 추가: `channelCount: 1`, `echoCancellation`, `noiseSuppression`, `autoGainControl`, `audio/webm;codecs=opus` MIME 타입 명시
- `ConversationService#reply`에 `rewind_audio(audio)` 호출 추가 (STT 후, ActiveStorage 첨부 전)
- `Ai::Client#prepare_audio_file`에서 `File.open(tmp_path, "rb")` 직접 사용
- `MessagesController#create`에 `rescue RuntimeError`, `rescue StandardError` 추가

**수정한 것:**
- AI가 trailing silence만 제거하도록 생성했으나, 이후 leading + trailing 모두 제거하도록 재수정
- `rewind_audio` 헬퍼 메서드를 별도로 추출

**검증:** `bundle exec rspec` 전체 통과, 브라우저에서 녹음 → 재생 → STT 정상 동작 확인

### 5-2. Play audio 정지 버튼 + 페이지 이탈 시 오디오 정리

**프롬프트:** "play audio 옆에 play되고 있는 소리를 중단하는 버튼 추가 / 페이지를 나가면 소리 자동 꺼짐 기능 추가"

**AI가 생성한 것:**
- `ConversationPage.tsx`에 `stopAudio` 함수 추가 (`audioRef.current.pause()` + `src = ''`)
- `playingId` 상태로 현재 재생 중인 메시지 추적, 재생 중이면 Stop 버튼 표시
- `useEffect` cleanup에서 `audioRef.current` pause + `previewUrlRef` revoke

**검증:** 브라우저에서 재생 → 정지, 페이지 이동 후 오디오 자동 정지 확인

---

## Phase 6: 녹음 중복 호출 방지

**날짜:** 2026-04-08

**프롬프트:** "useAudioRecorder에서 중복호출을 막을 수 있는 기능이 보이지 않아서 같은 훅 인스턴스에서 연속 클릭을 했을 때 getUserMedia가 중복으로 실행될 수 있을 것 같아"

**AI가 생성한 것:**
- `useAudioRecorder.ts`에 `busyRef = useRef(false)` 도입
- `startRecording`: `if (busyRef.current || mediaRecorderRef.current) return` 가드 + `try...finally`로 `busyRef.current = false` 보장
- `stopRecording`: `if (busyRef.current) return Promise.resolve(null)` 가드

**수정한 것:** 없음. AI 제안이 정확했음.

**검증:** 녹음 버튼 연속 클릭 시 중복 `getUserMedia` 호출 없음 확인

---

## Phase 7: 화폐 단위 + 플랜 정리 + Admin 페이지 재구성

**날짜:** 2026-04-08

### 7-1. 화폐 단위 변경 + 플랜 정리

**프롬프트:** "화폐 단위를 한국 돈(₩)으로 / Standard를 삭제하고 basic, premium만"

**AI가 생성한 것:**
- `PlansPage.tsx`의 `formatPrice`를 `₩${price.toLocaleString()}`으로 변경
- 플랜 그리드를 3열에서 2열(`md:grid-cols-2 max-w-2xl`)로 변경
- `db/seeds.rb`에서 Standard 플랜 삭제 로직 추가, Basic/Premium만 유지 (upsert 패턴)
- `premium` 변수 미정의 버그 수정 → `MembershipPlan.find_by!(name: "Premium")`으로 변경

**검증:** `rails db:seed` 실행, 브라우저에서 2개 플랜 + ₩ 표시 확인

### 7-2. Admin 페이지 전면 재구성

**프롬프트:** "어드민 페이지를 활성화시켜서 어드민이 유저에게 멤버십을 부여하고 삭제할 수 있도록"

**AI가 생성한 것:**
- **백엔드**: `Admin::UsersController#index` — 비관리자 유저 목록 + 활성 멤버십 포함
- **백엔드**: `Admin::MembershipsController#update` — 플랜 변경 + 기간 재설정
- **프론트**: `api/client.ts`에 `api.admin.users.list()`, `api.admin.memberships.update()` 추가
- **프론트**: `AdminPage.tsx` 전면 재작성 — 유저 카드, 멤버십 상태 표시, 부여/변경/삭제 인라인 편집
- **프론트**: `types/index.ts`에 `AdminUser` 인터페이스 추가

**수정한 것:** 없음.

**검증:** `npm run build` 성공, 브라우저에서 관리자 로그인 → 유저 목록 → 멤버십 부여/변경/삭제 동작 확인

---

## Phase 8: 인증 플로우 개선

**날짜:** 2026-04-08

### 8-1. 회원가입 → 로그인 분리

**프롬프트:** "회원가입을 진행하고 가입 완료하게 되면 회원가입이 완료되었다는 알림과 함께 로그인 페이지로 이동해서 로그인을 다시 진행하도록"

**AI가 생성한 것:**
- **백엔드**: `AuthController#register`에서 `token` 응답 제거 — 가입 시 자동 로그인 비활성화
- **백엔드**: `AuthController#register`에 `admin_code` 검증 추가 (`role: admin` + `admin_code != "0000"` → 에러)
- **프론트**: `RegisterPage.tsx`에 관리자 체크박스 + 관리자 코드 입력 필드 추가
- **프론트**: 가입 성공 시 `/login`으로 `state: { registered: true }` 전달하여 이동
- **프론트**: `LoginPage.tsx`에서 `location.state.registered`를 감지해 성공 배너 표시
- **프론트**: `AuthContext.tsx`의 `register` 함수에서 `setToken`/`setUser` 제거

**AI가 실수한 것:**
- RSpec auth spec에서 register 응답에 `token`이 없는 것을 기대하도록 변경하지 않아 테스트 실패 → spec 수정

**검증:** `bundle exec rspec` 전체 통과, 가입 → 로그인 페이지 이동 → 성공 배너 표시 확인

### 8-2. 관리자 로그인 간소화

**프롬프트:** "관리자의 경우 로그인 페이지에서 관리자 코드를 입력하지 않더라도 회원가입 과정에서 이미 관리자라고 체크되었기 때문에 관리자로 자동 로그인하도록 변경"

**AI가 생성한 것:**
- **백엔드**: `AuthController#login`에서 `admin_code` 체크 제거 — 이메일/비밀번호만으로 로그인
- **프론트**: `LoginPage.tsx`에서 관리자 코드 입력 UI 제거
- **프론트**: `AuthContext.tsx`의 `login` 함수에서 `adminCode` 파라미터 제거

**수정한 것:** 없음.

**검증:** 관리자 계정 이메일/비밀번호만으로 로그인 성공 확인

---

## Phase 9: 녹음 프리뷰 + 네트워크 안정성 강화

**날짜:** 2026-04-08

### 9-1. 녹음 프리뷰/확인 전송 UX

**프롬프트:** "녹음버튼을 누르고 녹음한 뒤 정지버튼을 눌렀을 때 바로 전송되지 않고 답변 완료 버튼을 눌러야 전송되도록 / 전송하기 전에 녹음한 내용을 들어볼 수 있도록"

**AI가 생성한 것:**
- `ConversationPage.tsx`에 `pendingAudio` 상태 추가 — 녹음 완료 시 바로 전송하지 않고 보관
- Preview / Re-record / Discard / Send 4가지 액션 버튼 UI
- `playPreview` 함수 — `URL.createObjectURL`로 로컬 재생
- `handleConfirmSend` — 확인 후에만 서버 전송
- `renderInputArea`를 3가지 상태(기본/녹음 중/프리뷰)로 조건부 렌더링

**수정한 것:** 없음.

**검증:** 녹음 → 정지 → 미리듣기 → 전송 플로우 정상 동작 확인

### 9-2. 네트워크 에러 처리 강화

**프롬프트:** "현재 네트워크 오류에 대비되는 설계가 되어있는지"

**AI가 생성한 것:**
- `api/client.ts`에 `AbortController` 기반 30초 타임아웃 추가
- `fetch` 호출을 `try/catch`로 감싸서 네트워크 오류(타임아웃 `AbortError`, 연결 실패 `TypeError`) 시 의미 있는 `ApiError` 메시지 생성
- `setOnUnauthorized` 콜백 메커니즘 도입 — 비-auth API 호출에서 401 응답 시 토큰 삭제 + `logout` 자동 호출
- `AuthContext.tsx`에서 `setOnUnauthorized(logout)` 등록

**수정한 것:** 없음.

**검증:** `npm run build` 성공

### 9-3. VAD 무음 트리밍 개선

**프롬프트:** "음성이 녹음되고 미리듣기 상황이 될 때 음성공백을 제거하고 음성이 있는 부분만 전송되도록"

**AI가 생성한 것:**
- `trimSilence` 함수를 앞뒤 양방향 무음 제거로 개선
- `firstVoice`/`lastVoice` 인덱스 탐색 + `BUFFER_CHUNKS` 여유분 유지
- 음성이 전혀 없으면 빈 배열 반환 → `stopRecording`에서 `null` 반환

**수정한 것:** 없음. 로직이 정확했음.

**검증:** 녹음 전후에 긴 침묵이 있어도 트림된 오디오만 전송됨 확인

---

## Phase 10: AI 통합 심화 + 어뷰징 방지

**날짜:** 2026-04-08

**프롬프트 요약:**
1. "LLM에 prompt를 활용하여 일관된 주제를 가지고 대화를 진행할 수 있도록 설계되었는지"
2. "AI와 대화 시 응답에 걸리는 지연 시간을 단축하기 위한 기술적/UX적인 방법"
3. "마이크 음성인식을 켠 상태로 많은 요청을 보내는 오남용을 방지하기 위한 계획"
4. ".env.example 말고 실제 API 키를 활용할 수 있는 구조로 변경"

**검토 후 계획 수립:** 코드 변경 전에 4개 항목에 대한 현황 분석 + 개선 계획을 먼저 제시하고, 사용자 검토 후 구현 진행

### 10-1. 실제 OpenAI API 키 사용 확인 + .env 문서화

**AI가 생성한 것:**
- `backend/.env`에 실제 `OPENAI_API_KEY`가 이미 설정되어 있고 `dotenv-rails`가 로드하는 구조임을 확인
- `backend/.env.example`에 상세한 주석 추가 — `.env` 파일의 역할, `dotenv-rails` 동작 방식, FakeClient 폴백 설명

### 10-2. 시스템 프롬프트 대폭 개선

**AI가 생성한 것:**
- `ConversationService::SYSTEM_PROMPT` 전면 재작성:
  - **주제 일관성**: 주제 이탈 시 자연스럽게 되돌리는 가이드
  - **응답 길이**: 2-3문장 + 후속 질문 1개 규칙
  - **문법 교정**: "틀렸다" 대신 자연스러운 리프레이징 방식
  - **턴 기반 대화 흐름**: Opening(1-2) → Development(3-6) → Wrap-up(7-9) → Closing(10)
  - **한국어 입력/빈 전사 처리**: 영어로 다시 시도 요청
- `build_system_prompt`에 동적 `turn_count` 포함
- `build_chat_history`에서 유저 메시지 수 기반 `turn_count` 계산

**수정한 것:** 없음.

**검증:** `bundle exec rspec` 전체 통과

### 10-3. TTS 레이턴시 감소 (mp3 포맷 전환)

**AI가 생성한 것:**
- `Ai::Client#synthesize`: `response_format`을 `"wav"` → `"mp3"`로 변경 — 파일 크기 감소 + 전송 속도 향상
- `ConversationService#attach_audio`: `filename` 확장자를 `.mp3`, `content_type`을 `"audio/mpeg"`으로 변경

**수정한 것:** 없음.

### 10-4. 어뷰징 방지 (프론트엔드)

**AI가 생성한 것:**
- `useAudioRecorder.ts`:
  - `MIN_RECORDING_MS = 1000` — 1초 미만 녹음 시 `null` 반환 (너무 짧은 녹음 차단)
  - `MAX_RECORDING_MS = 60000` — 60초 자동 정지 타이머
  - `recordingDuration` 상태 추가 + 실시간 타이머 표시
- `ConversationPage.tsx`:
  - `SEND_COOLDOWN_MS = 3000` — 전송 후 3초 쿨다운으로 연속 전송 차단
  - 메시지 잔여 횟수 표시 (`X / 20 remaining`), 4회 이하일 때 빨간색 경고
  - 60초 도달 시 자동 `stopRecording` → 프리뷰로 이동하는 `useEffect`

### 10-5. 어뷰징 방지 (백엔드)

**AI가 생성한 것:**
- `MessagesController`:
  - `RATE_LIMIT_PER_MINUTE = 10` — 분당 유저 메시지 10회 제한 (`check_rate_limit!` before_action)
  - `MAX_AUDIO_SIZE = 5.megabytes` — 오디오 파일 5MB 제한 (`check_audio_size!` before_action)
- `ConversationsController`:
  - `DAILY_CONVERSATION_LIMIT = 10` — 일일 대화 생성 10회 제한

**수정한 것:** 없음.

**검증:** `bundle exec rspec` 전체 통과, `npm run build` 성공, 브라우저에서 쿨다운/타이머/한도 표시 확인

---

## Phase 11: Ringle 스타일 UI 테마 전환

**날짜:** 2026-04-09

**프롬프트:** "https://www.ringleplus.com/ko/portal/home 이 링크의 UI를 가지고 현재 프로젝트의 UI를 수정해줘"

**AI가 생성한 것:**
- `index.css`: 다크 테마 CSS 변수를 링글 스타일 라이트 테마로 전면 교체
  - Primary: `#6C5CE7` (퍼플), Accent: `#00B894` (그린), Surface: `#F8F9FA`, Danger: `#E17055`
  - `body` 배경 화이트 + 텍스트 다크
- `Layout.tsx`: 화이트 네비게이션 + sticky + 활성 탭 퍼플 하이라이트
- `LoginPage.tsx` / `RegisterPage.tsx`: 화이트 카드 + 그림자 + rounded-2xl + 한국어 안내 텍스트
- `HomePage.tsx`: 화이트 카드 + hover shadow, 한국어 텍스트
- `PlansPage.tsx`: 라이트 테마 카드, 현재 플랜 퍼플 배경
- `ConversationListPage.tsx`: 화이트 카드 + hover 효과, 한국어 텍스트
- `ConversationPage.tsx`: 유저 버블(퍼플) / AI 버블(연한 회색) 라이트 테마, 입력 영역 화이트
- `AdminPage.tsx`: 화이트 카드 + 라이트 테마 폼 요소
- `FeatureStubPage.tsx`: 라이트 테마 + 한국어 텍스트
- `App.tsx`: 로딩 텍스트 색상 `text-white` → `text-gray-400`

**수정한 것:** 없음. 전체 10개 파일을 일괄 변환.

**검증:** `npm run build` 성공, 린트 에러 없음
