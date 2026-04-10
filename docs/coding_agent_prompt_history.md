### 1. 프로젝트 시작하기 직전 코딩을 바로 하지 않고 설계부터 하기 위한 프롬프트

You are my senior full-stack engineering partner for a take-home assignment.

I am building an AI Tutor web app.
Your role is to help me produce a submission-quality project, not just working code.

Important constraints:

- Backend must use Ruby on Rails
- Frontend must use TypeScript + React
- Persistent storage is required
- High-quality tests are mandatory
- Payment integration must be mocked
- LLM/STT/TTS should use real integrations where possible
- Admin UI is required
- Membership expiration and feature access control are core requirements
- README and AI tool interaction history documentation are required

Do NOT start coding yet.

First, do only the following:

1. Summarize the assignment into a precise implementation checklist.
2. Identify ambiguous requirements and propose reasonable assumptions.
3. Propose a practical architecture for backend and frontend.
4. Define the core domain models and their responsibilities.
5. Define the main API endpoints.
6. Define the frontend page structure and user flows.
7. Propose the best implementation order for a take-home project.
8. Propose a testing strategy.
9. Propose what should be MVP vs optional/stretch.
10. List the initial folder/file plan.

Use this exact output structure:
A. Understanding
B. Assumptions
C. Architecture proposal
D. Domain models
E. API design
F. Frontend flow
G. Implementation order
H. Testing strategy
I. MVP vs stretch
J. File/folder plan

Keep the plan practical, submission-oriented, and simple.
Do not generate code yet.

### 2-1. 설계안을 staff reviewer처럼 비판적으로 보도록 하는 프롬프트

Act as a strict staff-level reviewer.

You are NOT the original designer now.
Your job is to critically review the proposed architecture/design for my AI Tutor take-home assignment and identify all weaknesses before implementation starts.

I want a brutally honest design review.

==================================================
REVIEW OBJECTIVE
==================================================
Evaluate whether this design is:

1. aligned with the assignment requirements,
2. realistic to implement within take-home scope,
3. extensible enough without overengineering,
4. robust in domain modeling,
5. clean in API and frontend flow design,
6. testable,
7. likely to produce a strong submission.

Do NOT assume the design is good.
Try to break it.

==================================================
ASSIGNMENT CONSTRAINTS YOU MUST CHECK AGAINST
==================================================
This project must support:

- Backend: Ruby on Rails
- Frontend: TypeScript + React
- Persistent storage
- High-quality tests
- Membership creation and deletion
- Membership expiration handling
- Membership feature combinations:
  - Learning
  - Conversation
  - Analysis
- Admin assignment API + Admin UI
- User purchase API
- Payment must be mocked
- LLM/STT/TTS should be real integrations where possible
- Home screen showing current membership
- Purchase support on home screen if implemented
- Membership validation before entering conversation
- AI starts the conversation first
- Microphone recording
- Waveform or similar recording UX
- “response complete” triggers STT -> AI reply
- replay audio
- VAD-based silence removal before STT
- consistent-topic prompting
- latency reduction strategy
- abuse prevention strategy
- network error handling
- README/doc requirements
- coding_agent_interaction_history documentation support
- code quality suitable for teammate review

==================================================
REVIEW INSTRUCTIONS
==================================================
Review the proposed design across all of the following categories.

For each category:

- identify strengths
- identify weaknesses
- identify missing requirements
- identify overengineering
- identify implementation risks
- propose a better alternative when needed

==================================================
CATEGORIES TO REVIEW
==================================================

1. Requirement coverage

- Does the design explicitly cover every required feature?
- Which requirements are vague, partially covered, or missing?
- Are there any requirements that are implicitly assumed but not concretely designed?

2. Scope control / take-home realism

- Is the design too ambitious for a take-home project?
- Which parts are MVP-appropriate?
- Which parts should be simplified, deferred, or mocked?
- Is there any “nice architecture” that is unnecessary for this assignment?

3. Domain model quality

- Are the core domain entities correct?
- Are membership products/plans and user memberships separated appropriately?
- Is expiration modeled correctly?
- Are feature permissions modeled in a scalable and readable way?
- Is there confusion between purchase/payment records and active memberships?
- Are state transitions clear?

4. Backend architecture

- Are responsibilities well separated?
- Are controllers too fat?
- Are service objects justified?
- Is authorization/access logic centralized?
- Is payment mock integration placed cleanly?
- Are AI provider integrations abstracted appropriately?
- Is persistence strategy sound?

5. API design

- Are the endpoints coherent and minimal?
- Do request/response shapes make sense for frontend use?
- Are there missing validation/error cases?
- Are admin APIs separated clearly from user APIs?
- Is conversation access validation designed clearly?

6. Frontend architecture

- Are pages/screens well scoped?
- Is state management too complex or too weak?
- Is the API integration strategy clean?
- Is the audio flow realistic in the browser?
- Are recording / processing / replay / error UX states properly considered?
- Is admin UI scope reasonable?

7. AI/audio integration design

- Are LLM/STT/TTS boundaries clean?
- Is VAD placement realistic?
- Is there a sensible topic continuity strategy?
- Is the latency mitigation plan realistic?
- Is abuse prevention actually enforceable?
- Are external dependency failures handled?

8. Data persistence / lifecycle

- What data must be persisted vs what can remain session-only?
- Is anything important incorrectly left ephemeral?
- Is anything unnecessary being persisted?

9. Testing strategy

- Can this design be tested well?
- Are there seams/interfaces for mocking external providers?
- Are the most important failure modes covered?
- Is the test plan too shallow?
- Which tests are absolutely required before submission?

10. Documentation / submission readiness

- Does the design make it easy to produce:
  - README
  - architecture explanation
  - testing guide
  - coding_agent_interaction_history
- Are assumptions and tradeoffs easy to explain to reviewers?

11. Maintainability / reviewer impression

- Will this look like peer-review-quality code?
- Are there naming/modeling smells?
- Are there likely refactor hotspots?
- What parts will reviewers criticize first?

==================================================
OUTPUT FORMAT
==================================================
Return your review in the exact structure below:

A. Overall verdict

- 1 paragraph summary
- state whether the design is:
  - strong,
  - acceptable with revisions,
  - risky,
  - or needs redesign

B. Requirement coverage audit

- checklist of all required items
- mark each as:
  - Covered
  - Partially covered
  - Missing
- explain any partial/missing items

C. Critical issues (P0)

- these would likely cause requirement failure, architecture failure, or major reviewer concern

D. Important improvements (P1)

- these are not fatal, but should be changed before implementation

E. Nice-to-have improvements (P2)

- optional improvements if time allows

F. Overengineering / simplification opportunities

- what should be removed, merged, deferred, or simplified

G. Hidden risks

- likely implementation traps
- likely integration traps
- likely testing traps
- likely demo-day traps

H. Revised recommendation

- propose a cleaner/simpler architecture if necessary
- include:
  - domain model adjustments
  - API adjustments
  - frontend flow adjustments
  - testing adjustments

I. Go / no-go recommendation

- Can implementation start now?
- If not, what must be fixed first?

==================================================
IMPORTANT REVIEW BEHAVIOR
==================================================

- Be concrete, not vague.
- Do not praise weak design.
- Prefer simpler architecture if it still satisfies the assignment.
- Flag anything that is elegant but impractical.
- Flag anything that makes testing difficult.
- Flag anything that makes documentation difficult.
- Flag anything likely to create bugs around membership expiration, permissions, or audio flow.
- Flag anything likely to weaken the final submission impression.

Now review the proposed design.

### 2-2 설계 검토 강화 문장

Assume the reviewer will actively look for:

- requirement gaps,
- fake completeness,
- weak testing,
- shallow domain modeling,
- unrealistic AI/audio implementation,
- poor tradeoff decisions,
- and overbuilt architecture.

Your job is to detect these before they do.

### 2-3. P0만 수정하게 하는 프롬프트

Take your review and fix only the P0 issues.

Return:

1. revised architecture summary,
2. revised domain model,
3. revised API list,
4. revised frontend page flow,
5. revised test priorities.

Keep it simpler, not bigger.

### 2-4. 과제 범위에 맞게 간소화하는 프롬프트

Simplify the design for take-home scope.

Rules:

- preserve all required features
- reduce implementation risk
- reduce external dependency complexity
- improve testability
- improve demo reliability

Show before/after decisions and explain why each simplification is better.

### 2-5. 리뷰어 질문 20개 뽑는 프롬프트

Pretend you are the hiring reviewer seeing this architecture for the first time.

Ask the 20 toughest questions you would ask about:

- requirement coverage
- domain design
- membership expiry/permission handling
- payment mocking
- AI/STT/TTS realism
- audio UX feasibility
- testing depth
- documentation completeness
- maintainability

Then answer each question honestly based on the current design.

### 3-1. Phase분해 및 구현 시작 프롬프트\_Phase를 작은 단위로 쪼개는 프롬프트

Let's break Phase 1 into smaller sub-phases so I can review and understand the code properly.

Rules:

- each sub-phase should have a narrow responsibility
- each sub-phase should be small enough to review comfortably
- each sub-phase must include clear done criteria
- after each sub-phase, stop and summarize:
  1. what was implemented
  2. which files changed
  3. key logic decisions
  4. tests added
  5. how I should review it before moving on

Now propose the best sub-phase breakdown for Phase 1.
Do not generate code yet.

### 3-2. Phase 1 시작 프롬프트

Let's start Phase 1.

Phase 1 goal:
Build the backend foundation for membership and purchase flow with strong tests.

Scope:

- Rails project/backend foundation
- core domain models for membership plans, user memberships, and purchases/payments as needed
- membership expiration logic
- feature permission checks
- admin membership assignment/removal API
- user purchase API using a mock payment gateway
- membership status query API
- persistent storage setup
- high-quality backend tests for models, services, and requests

Requirements:

- keep the design simple and submission-oriented
- use idiomatic Rails patterns
- centralize entitlement/expiration/permission logic
- separate purchase/payment records from active membership state
- do not implement conversation/audio yet
- do not overengineer

Before writing code:

1. restate the Phase 1 objective,
2. list the files you plan to create/change,
3. explain key design choices briefly,
4. list tests you will add.

Then implement in small coherent steps.
After each major step, summarize:

- what was added
- what remains
- how to verify it

### 4-1. 테스트 중심 구현 프롬프트\_테스트 우선

Let's implement the next backend sub-phase in a test-first, review-friendly way.

Rules:

- keep the scope narrow
- start by listing the exact behaviors to verify
- write or update the relevant specs first
- then implement the code
- then show me:
  1. files changed
  2. tests added
  3. commands to run only the relevant specs
  4. likely edge cases
  5. what I should review before moving on

Do not touch unrelated areas.

### 4-2 짧은 테스트 포함 구현 프롬프트

Implement this feature with tests.
Start by listing the test cases first.
Then add the tests.
Then implement the code.
Then show me how to run only the relevant specs.

### 4-3. 테스트 리뷰 프롬프트

Review the current backend tests for this sub-phase.

Check:

- whether the tests reflect the assignment requirements
- whether failure cases are covered
- whether the tests are too implementation-coupled
- whether any critical edge cases are missing

Return:

1. strong tests
2. weak/missing tests
3. the next 3 tests I should add

### 5-1. 코드리뷰 프롬프트\_전체 코드리뷰 체크리스트 프롬프트

Act as a strict senior/staff engineer performing a submission-critical code review.

You are reviewing code generated for an AI Tutor full-stack take-home assignment.

Your goal is NOT to be polite.
Your goal is to find every issue that could weaken the final submission:

- requirement gaps,
- hidden bugs,
- poor abstractions,
- weak tests,
- fragile audio/AI integration,
- bad UX/error handling,
- Rails/React anti-patterns,
- unclear naming,
- maintainability problems,
- overengineering,
- and anything that would make a reviewer lose confidence.

Determine whether the current codebase is:

1. correct against the assignment requirements,
2. robust enough for demo and review,
3. maintainable,
4. well-tested,
5. realistically implementable within the take-home scope,
6. and likely to leave a strong reviewer impression.

Review categories:

- requirement coverage
- domain logic correctness
- backend code quality
- frontend code quality
- audio/AI integration quality
- abuse prevention
- error handling and resilience
- test quality
- documentation/submission readiness
- maintainability/reviewer impression

Output:
A. Overall assessment
B. Requirement audit
C. P0 issues
D. P1 issues
E. P2 issues
F. Hidden bug risks
G. Test gap analysis
H. Simplification opportunities
I. Reviewer-impression analysis
J. Exact next actions

Be concrete. Be skeptical. Focus especially on membership entitlement logic, payment mocking boundaries, audio lifecycle correctness, AI integration reliability, and test depth.
Now review the current codebase.

### 5-2. 코드리뷰 강화 프롬프트

Assume a hiring reviewer will inspect this code for:

- requirement misses hidden behind polished UI,
- weak backend domain logic,
- superficial tests,
- unrealistic AI/audio integration,
- poor failure handling,
- and evidence that generated code was not critically reviewed.

Find those problems first.

### 6. 오디오 / 대화 기능 전용 프롬프트

## 6-1. 오디오 전용 리뷰 프롬프트

Review only the conversation/audio-related implementation as if it were the most risky part of the codebase.

Focus on:

- recording lifecycle
- stopping/cleanup behavior
- replay support for both user and assistant audio
- conflicts between recording, sending, and playback
- error handling around mic permissions, empty audio, STT/TTS failure
- code readability and maintainability
- whether this looks production-minded or fragile

Return:

1. strongest parts
2. fragility points
3. must-fix issues
4. exact improvement suggestions

## 6-2. conversation audio gap 분석 프롬프트

Act as a strict product/engineering reviewer.

Given the current implementation state, identify the exact gap between:

1. the assignment requirements,
2. the current implementation,
3. and the minimum acceptable demo-ready submission.

Focus especially on the conversation/audio flow.

Return:
A. fully completed requirements
B. partially completed requirements
C. missing requirements
D. demo-critical gaps
E. non-critical polish gaps
F. the smallest set of changes needed to become submission-ready

Do not suggest large refactors.
Prefer the smallest reliable fixes.

## 6-3. audio acceptance criteria 프롬프트

Define acceptance criteria for the conversation audio flow.

Focus only on the minimum submission-ready implementation.

Include:

1. user recording start/stop behavior
2. visible recording feedback requirements
3. STT success/failure behavior
4. AI response audio playback behavior
5. replay behavior
6. loading/error states
7. abuse-prevention minimums
8. what can be simplified for take-home scope

Return the criteria as a clear checklist.
Do not generate code yet.

## 6-4. audio 최소 수정 구현 프롬프트

Implement only the missing conversation audio functionality needed to satisfy the acceptance criteria.

Rules:

- do not refactor unrelated areas
- do not redesign the architecture
- preserve the current conversation flow
- make the smallest reliable changes
- prioritize demo stability over elegance

Before coding:

1. list the missing behaviors to implement,
2. list the files to change,
3. explain how each change maps to the acceptance criteria,
4. list the tests/manual checks needed.

Then implement in small steps and stop after each step.

6-5. conversation audio 안정화 리뷰 프롬프트

Review the current conversation audio flow implementation and improve only the minimum parts needed for a stable take-home demo.

Focus on:

1. reliable user voice recording lifecycle
2. replay support for both user and assistant audio
3. preventing conflicting states between recording, sending, and playback
4. clearer audio-related error handling
5. preserving the current architecture and UI structure

Rules:

- do not refactor unrelated areas
- do not redesign the whole conversation page
- keep changes as small and safe as possible
- prioritize demo reliability over elegance

Before coding:
A. list the current audio-flow weaknesses you see
B. propose the smallest set of changes
C. map each change to the assignment requirements
D. list manual test scenarios

Then implement step by step.

7. 최종 제출 전 리뷰 프롬프트

Act as a strict staff-level engineer and hiring reviewer.

Review this project as if it is the final pre-submission review for the Ringle AI Tutor full-stack take-home assignment.

Your job is to determine whether this implementation is truly ready to submit.
Do NOT review it as a generic side project.
Review it against the actual assignment requirements and against the standard of code that teammates could realistically review in a company.

Review against:

- membership creation/deletion
- expiration
- feature combinations
- admin API + admin UI
- user purchase API
- mocked payment
- persistent storage
- home membership display
- membership check before conversation
- AI starts first
- microphone input
- waveform/audio UX
- response-complete STT flow
- replay for both user and AI
- network errors
- VAD/silence trimming
- prompt-based topic consistency
- latency reduction
- abuse prevention
- real LLM/STT/TTS where possible
- teammate-review quality
- automated tests
- README
- coding_agent_interaction_history
- demoability including audible AI tutor audio

Do NOT treat these as required:

- real PG integration
- overbuilt auth architecture
- extra session APIs beyond take-home scope

Output:
A. Final submission verdict
B. Required features audit
C. P0 must-fix issues
D. P1 high-value improvements
E. Optional polish
F. Highest-risk files or flows
G. Missing or weak tests
H. Demo / docs / reviewer trust risks
I. Smallest high-impact next steps
J. Interview readiness

Be concrete. Be strict. Focus on the project as it actually exists today.
