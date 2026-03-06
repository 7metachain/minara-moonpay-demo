# Card-to-Autopilot PoC

> Minara x MoonPay integration demo — from credit card deposit to AI-managed trading workflow in one flow.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

This PoC validates the **Card → USDC → Starter Prompt → Confirm → Workflow → Notification** loop as a user activation funnel for Minara. All MoonPay interactions are simulated via sandbox mocks — no real payments or API keys required.

### What It Demonstrates

| Step | What Happens |
|------|-------------|
| **1. Deposit** | User buys USDC with a credit card (MoonPay sandbox). Webhook simulates payment confirmation. |
| **2. Starter Prompt** | System auto-recommends a low-risk AI trading plan after deposit succeeds. |
| **3. Plan & Execute** | User reviews the plan (risk controls, trade steps) and confirms. First trade is simulated. |
| **4. Notification** | Mock Telegram notification sent to confirm execution. |
| **5. Dashboard** | Real-time funnel metrics, KPIs, and failure breakdown. |

### Demo Controls

Built-in controls let you switch between success and failure scenarios:

- **Auto (Success)** — happy path, deposit succeeds
- **Fail: KYC Pending** — simulates MoonPay KYC hold
- **Fail: Payment Declined** — simulates card decline

## Quick Start

```bash
# Clone
git clone https://github.com/7metachain/minara-moonpay-demo.git
cd minara-moonpay-demo

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

> No `.env` configuration needed — everything runs with in-memory mocks.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend — Step Wizard UI (React)                  │
│  DepositStep → PlanStep → NotificationStep          │
│  DemoControls, MetricsDashboard                     │
├─────────────────────────────────────────────────────┤
│  API Routes (Next.js Server)                        │
│  POST /api/poc/card-to-autopilot                    │
│  POST /api/poc/moonpay-webhook                      │
│  GET  /api/poc/metrics                              │
├─────────────────────────────────────────────────────┤
│  Domain Services                                    │
│  DepositService · WebhookService · WorkflowService  │
│  NotificationService · MetricsService               │
├─────────────────────────────────────────────────────┤
│  In-Memory Store (PoC level)                        │
│  Orders · Wallets · Workflows · Events              │
└─────────────────────────────────────────────────────┘
```

### State Machines

**Order lifecycle:**

```
created ──→ pending ──→ success  (terminal, idempotent)
   │            │
   └────────────┴──→ failed     (terminal)
```

**Experience flow:**

```
deposit_success → prompt_ready → plan_generated → confirmed → workflow_active → notified
```

## Project Structure

```
minara-moonpay-demo/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Main wizard UI
│   │   ├── layout.tsx                       # App layout (dark theme)
│   │   └── api/poc/
│   │       ├── card-to-autopilot/route.ts   # Core PoC endpoint
│   │       ├── moonpay-webhook/route.ts     # Simulated webhook receiver
│   │       └── metrics/route.ts             # Funnel & KPI data
│   ├── components/
│   │   ├── DepositStep.tsx                  # Card deposit UI + polling
│   │   ├── PlanStep.tsx                     # Plan generation + confirmation
│   │   ├── NotificationStep.tsx             # Execution result + notification
│   │   ├── DemoControls.tsx                 # Success/fail toggle for demos
│   │   ├── MetricsDashboard.tsx             # Funnel chart + KPIs + event log
│   │   └── StatusBadge.tsx                  # Reusable status indicator
│   └── lib/
│       ├── types.ts                         # Order, Wallet, Workflow, Event types
│       ├── store.ts                         # In-memory data store (singleton)
│       └── services/
│           ├── deposit.ts                   # Order creation, wallet credit
│           ├── webhook.ts                   # Idempotent webhook handler
│           ├── workflow.ts                  # Plan generation, trade simulation
│           ├── notification.ts              # Mock Telegram with retry
│           └── metrics.ts                   # Event tracking, funnel aggregation
├── idea.md                                  # Original PoC specification
└── package.json
```

## KPIs Tracked

| KPI | Definition |
|-----|-----------|
| **Deposit Conversion Rate** | `deposit_success / (deposit_success + deposit_failed)` |
| **Median TTFV** | Time from session start to first trade execution |
| **Execution Completion Rate** | `first_execution_filled / plan_generated` |
| **Notification Delivery Rate** | `notification_sent / (notification_sent + notification_failed)` |

## Event Tracking

Every step emits a structured analytics event:

```
deposit_clicked → moonpay_checkout_created → moonpay_webhook_received
→ deposit_success / deposit_failed → starter_prompt_shown
→ plan_generated → execution_confirmed → workflow_created
→ first_execution_filled → notification_sent / notification_failed
```

Each event includes: `userId`, `sessionId`, `orderId`, `timestamp`, `channel`, `errorCode`.

## Acceptance Criteria (DoD)

- [x] Success path completes in under 3 minutes
- [x] Failure paths cover `KYC_PENDING` and `PAYMENT_FAILED`
- [x] Duplicate webhooks do not re-credit wallet (idempotent)
- [x] Funnel dashboard shows all 4 KPIs in real time
- [x] Every failure shows a user-understandable next-step hint

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Data | In-memory store (Map-based singleton) |
| Payments | MoonPay sandbox simulation |
| Notifications | Mock Telegram (console log) |

## Roadmap (Post-PoC)

- [ ] Real MoonPay integration with live webhook verification
- [ ] Persistent storage (SQLite / PostgreSQL)
- [ ] Real Telegram Bot API integration
- [ ] Multi-region compliance rules
- [ ] Cohort-based gradual rollout controls

## License

MIT
