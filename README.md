# AI English Tutor

A membership-based AI English conversation tutor with real OpenAI integration (GPT-4o-mini, Whisper STT, TTS-1).

## What’s Implemented

- Membership-based access with expiration and feature gating (`learning`, `conversation`, `analysis`)
- Admin membership assignment/removal + user self-purchase flow with mocked payment
- AI-first conversation flow with real OpenAI integration where available
- Voice conversation flow with microphone input, STT, TTS, and replay support
- Persistent storage with Rails + PostgreSQL
- Backend automated tests for core domain, service, and request flows

## Quick Start

### Prerequisites

- Ruby 3.3+ / Rails 8.1
- Node.js 20+ / npm
- PostgreSQL 14+
- (Optional) OpenAI API key for real AI responses

### 1. Backend Setup

```bash
cd backend
bundle install
bin/rails db:create db:migrate db:seed
```

To enable real OpenAI integration, set the API key:

```bash
export OPENAI_API_KEY=your-key-here
```

Without the key, the app runs in **demo mode** with fake AI responses.

Start the server:

```bash
bin/rails server  # http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Rails backend automatically.

### 3. Demo Accounts

Please log in with a demo account or create a new account.

You can also create an admin account (enter admin code 0000 when signing up).

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| Admin | tjdgus96@naver.com  | roemflq3308 |
| User  | rkffpq818@naver.com | roemflq3308 |

The demo user comes with a **Premium** membership (learning + conversation + analysis, 30 days).

## Suggested Demo Flow

1. Log in as the demo user
2. Purchase the premium membership and check your membership plan
3. Open the conversation screen
4. Verify that the AI speaks first
5. Record or type a reply
6. Confirm STT → AI response → TTS playback
7. Replay both user and assistant audio
8. Log in as admin and assign/revoke a membership

### Running Tests

```bash
cd backend
bundle exec rspec   # 155 examples, 0 failures
```

---

## Architecture

```
frontend/  (Vite + React 19 + TypeScript 6)
├── src/api/         API client (fetch wrapper, token management)
├── src/context/     AuthContext (login/register/logout/refresh)
├── src/hooks/       useAudioRecorder (MediaRecorder + AnalyserNode)
├── src/pages/       Login, Register, Home, Plans, Conversations, Admin, Stubs
└── src/components/  Layout (nav + Outlet)

backend/   (Rails 8.1 API + PostgreSQL)
├── app/models/           User, MembershipPlan, UserMembership, Conversation, Message
├── app/controllers/api/  Auth, Plans, Purchases, Conversations, Messages, Admin::Memberships
├── app/services/         ConversationService, PurchaseService, MockPaymentGateway, Ai::Client/FakeClient
└── spec/                 16 spec files (model, request, service)
```

### Tech Stack Rationale

| Choice                          | Why                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `has_secure_token` (not JWT)    | Simpler. No refresh logic, no expiration management. DB-backed token invalidation is trivial.  |
| `Ai::Client` / `Ai::FakeClient` | DI pattern. Real OpenAI in prod, fake in tests/demo. Configured via `OPENAI_API_KEY` presence. |
| `MockPaymentGateway` with DI    | `PurchaseService.new(gateway:)` — swap gateway without touching business logic.                |
| PostgreSQL array for `features` | No join table needed. Simple `%w[learning conversation analysis]` checks.                      |
| `ActiveStorage` proxy mode      | Serves audio files through Rails proxy, avoiding CORS issues with direct storage URLs.         |
| Tailwind CSS v4                 | Utility-first, dark theme, zero config with `@tailwindcss/vite` plugin.                        |
| TanStack Query                  | Server state caching, automatic refetch, optimistic updates for conversation messages.         |

### Domain Model

```
User (has_secure_password, has_secure_token :auth_token)
  ├── has_many :user_memberships
  │     └── belongs_to :membership_plan (features[], duration_days, price_cents)
  └── has_many :conversations
        └── has_many :messages (role enum, content, has_one_attached :audio)
```

### API Endpoints

| Method | Endpoint                           | Auth      | Purpose                              |
| ------ | ---------------------------------- | --------- | ------------------------------------ |
| POST   | /api/v1/auth/register              | -         | Sign up                              |
| POST   | /api/v1/auth/login                 | -         | Sign in                              |
| GET    | /api/v1/auth/me                    | User      | Current user + active membership     |
| GET    | /api/v1/plans                      | -         | List membership plans                |
| POST   | /api/v1/purchases                  | User      | Purchase plan (mock payment)         |
| GET    | /api/v1/conversations              | User+conv | List conversations                   |
| GET    | /api/v1/conversations/:id          | User+conv | Conversation detail with messages    |
| POST   | /api/v1/conversations              | User+conv | Start conversation (AI speaks first) |
| POST   | /api/v1/conversations/:id/messages | User+conv | Send message (text or audio)         |
| GET    | /api/v1/admin/memberships          | Admin     | List all memberships (filterable)    |
| POST   | /api/v1/admin/memberships          | Admin     | Assign membership to user            |
| DELETE | /api/v1/admin/memberships/:id      | Admin     | Revoke membership                    |

### Conversation Flow

1. User selects a topic → `POST /conversations` creates session + system prompt + AI first message with TTS audio
2. User sends text or records audio → `POST /conversations/:id/messages`
3. Backend: audio → Whisper STT → GPT-4o-mini (with chat history) → TTS-1 → response with audio
4. Frontend: optimistic message append, auto-play AI audio, volume visualization during recording
5. Abuse prevention: 20 messages per conversation limit

### Testing Strategy

- **Model specs**: Validations, associations, business logic (active?, has_feature?, remaining_days)
- **Service specs**: PurchaseService (success/decline/DI), ConversationService (start/reply/limit), MockPaymentGateway, Ai::Client (WebMock), Ai::FakeClient
- **Request specs**: All API endpoints with auth/authz edge cases (401, 403, 404, 422)
- **WebMock**: All external HTTP calls blocked in test environment
- **FactoryBot + Shoulda Matchers**: Consistent test data and declarative matchers

---

## Documentation

- `docs/coding_agent_interaction_history.md` — AI tool interaction log (prompts, generated code, modifications, errors)
