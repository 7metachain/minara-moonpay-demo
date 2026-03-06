Architecture

flowchart TB
  subgraph frontend [Frontend - Step Wizard UI]
    DepositStep --> WebhookWait
    WebhookWait --> PromptStep
    PromptStep --> PlanStep
    PlanStep --> ConfirmStep
    ConfirmStep --> NotifyStep
    NotifyStep --> ResultStep
  end

  subgraph api [API Routes]
    CardToAutopilot["POST /api/poc/card-to-autopilot"]
    Webhook["POST /api/poc/moonpay/webhook"]
    Metrics["GET /api/poc/metrics"]
  end

  subgraph services [Domain Services]
    DepositService
    WebhookService
    WorkflowService
    NotificationService
    MetricsService
  end

  subgraph data [In-Memory Store]
    Orders
    Wallets
    Workflows
    Events
  end

  frontend --> api
  api --> services
  services --> data
  Webhook --> WebhookService
  WebhookService --> DepositService

State Machines

Order: created -> pending -> success | failed (success is terminal; duplicate success webhooks do not re-credit)

Experience: deposit_success -> prompt_ready -> plan_generated -> confirmed -> workflow_active -> notified

Project Structure

All files under minara-moonpay-demo/:

minara-moonpay-demo/
├── idea.md                          (existing)
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                 <- main wizard UI
│   │   └── api/
│   │       └── poc/
│   │           ├── card-to-autopilot/route.ts
│   │           ├── moonpay-webhook/route.ts
│   │           └── metrics/route.ts
│   ├── lib/
│   │   ├── types.ts                 <- Order, Wallet, Workflow, Event types + enums
│   │   ├── store.ts                 <- singleton in-memory store (Map-based)
│   │   └── services/
│   │       ├── deposit.ts           <- createOrder, updateOrderStatus, creditWallet
│   │       ├── webhook.ts           <- verifySignature (stub), idempotent processing
│   │       ├── workflow.ts          <- generatePlan, confirmExecution
│   │       ├── notification.ts      <- send + retry (mock Telegram)
│   │       └── metrics.ts           <- trackEvent, getFunnelMetrics, getFailureBreakdown
│   └── components/
│       ├── StepWizard.tsx           <- orchestrator component with step state
│       ├── DepositStep.tsx          <- MoonPay sandbox trigger + status display
│       ├── PlanStep.tsx             <- shows generated plan, confirm button
│       ├── NotificationStep.tsx     <- shows notification status
│       ├── MetricsDashboard.tsx     <- funnel chart + KPIs + failure breakdown
│       ├── DemoControls.tsx         <- force success/fail toggle, cohort selector
│       └── StatusBadge.tsx          <- reusable status indicator

Implementation Details

1. Project Scaffolding

Use create-next-app with TypeScript + Tailwind (same stack as minara-api-cookbook demo-app). Same styling conventions: dark theme, CSS variables, Geist fonts.

2. Types and In-Memory Store (src/lib/types.ts, src/lib/store.ts)

Core types following the spec:

type OrderStatus = "created" | "pending" | "success" | "failed";
type ExperienceStage = "deposit_success" | "prompt_ready" | "plan_generated"
  | "confirmed" | "workflow_active" | "notified";

interface Order {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

interface AnalyticsEvent {
  name: string;  // deposit_clicked, deposit_success, plan_generated, etc.
  userId: string;
  sessionId: string;
  orderId?: string;
  timestamp: number;
  channel: "moonpay";
  errorCode?: string;
}

The store is a singleton Map-based object exported from store.ts. PoC-level, no persistence. Four collections: orders, wallets, workflows, events.

3. Domain Services (5 files in src/lib/services/)





deposit.ts: createOrder() generates a mock MoonPay order (status=created), processWebhook() transitions order through the state machine. On success, credits the user wallet and tracks deposit_success.



webhook.ts: handleWebhook() with idempotency check (if order already at success, skip). Signature verification is stubbed but the function signature is production-shaped. Handles out-of-order callbacks by checking current state before transitioning.



workflow.ts: generatePlan() returns a hardcoded low-risk starter plan (buy $20 ETH in 2 batches, max 1x/day, Telegram notification, confirmation required). confirmExecution() creates a workflow record and simulates the first trade execution.



notification.ts: sendNotification() mocks a Telegram message. Has 1 retry on failure. Records success/failure in events.



metrics.ts: trackEvent() appends to the events store. getFunnelMetrics() aggregates counts at each stage. getFailureBreakdown() groups failures by errorCode.

4. API Routes (3 files)

POST /api/poc/card-to-autopilot (route.ts) — A single endpoint with action field:





action: "deposit" -> calls DepositService.createOrder, returns orderId + simulated MoonPay checkout URL. Auto-triggers a simulated webhook after 2s delay (via setTimeout) for the "success path" demo.



action: "generate_plan" -> calls WorkflowService.generatePlan with the starter prompt template.



action: "confirm_execution" -> calls WorkflowService.confirmExecution + NotificationService.sendNotification.

POST /api/poc/moonpay-webhook (route.ts) — Receives mock webhook payload { orderId, status, signature }. Calls WebhookService.handleWebhook. Idempotent: duplicate success returns 200 without re-crediting.

GET /api/poc/metrics (route.ts) — Returns { funnel, failures, kpis } from MetricsService.

5. Frontend UI

page.tsx (StepWizard) — A vertical stepper UI with 5 steps:





Deposit — "Buy USDC with Card" button. Shows order status badge (created/pending/success/failed). Demo controls to force success or inject failure (KYC_PENDING, PAYMENT_FAILED).



Starter Prompt — Auto-shows after deposit success. Displays the recommended prompt template with risk parameters highlighted.



Plan — Shows the generated execution plan as a structured card (amount, frequency, conditions). "Confirm and Execute" button.



Execution + Notification — Shows simulated trade result and notification delivery status.



Summary — End-to-end timing, all events, final wallet balance.

DemoControls.tsx — Sticky panel at the top or sidebar. Contains:





"Force Success" / "Force Fail" toggle for the webhook



Error type selector (KYC_PENDING, PAYMENT_FAILED, DEPOSIT_TIMEOUT)



"Reset Demo" button to clear all state

MetricsDashboard.tsx — Below the wizard or in a separate tab. Shows:





Funnel bar chart (deposit_clicked -> deposit_success -> plan_generated -> confirmed -> notified)



4 KPI cards (conversion rate, TTFV median, execution completion rate, notification delivery rate)



Failure breakdown table (error code, count, percentage)

6. Event Tracking

All events follow the schema from idea.md. Events are tracked at each service call:





deposit_clicked (frontend)



moonpay_checkout_created (deposit service)



moonpay_webhook_received (webhook service)



deposit_success / deposit_failed (webhook service)



starter_prompt_shown (frontend)



plan_generated (workflow service)



execution_confirmed (workflow service)



workflow_created (workflow service)



first_execution_filled (workflow service)



notification_sent / notification_failed (notification service)

7. Verification against DoD

From idea.md acceptance criteria:





Success path demo in under 3 minutes: The wizard auto-advances steps. Simulated webhook fires in 2s.



Failure paths: DemoControls injects KYC_PENDING and PAYMENT_FAILED. UI shows user-friendly error messages with "next step" guidance.



Idempotent webhook: WebhookService checks order status before processing.



Funnel dashboard: MetricsDashboard shows all 4 KPIs in real time.



Every failure has a user-understandable next-step hint.

