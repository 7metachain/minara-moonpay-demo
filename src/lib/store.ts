import type {
  Order,
  WalletBalance,
  ExecutionPlan,
  Workflow,
  Notification,
  AnalyticsEvent,
} from "./types";

interface Store {
  orders: Map<string, Order>;
  wallets: Map<string, WalletBalance>;
  plans: Map<string, ExecutionPlan>;
  workflows: Map<string, Workflow>;
  notifications: Map<string, Notification>;
  events: AnalyticsEvent[];
  /** Tracks first-execution timestamps per user for TTFV calculation */
  firstExecutionTimes: Map<string, number>;
  /** Tracks login/session-start timestamps per user */
  sessionStartTimes: Map<string, number>;
  /** Demo controls */
  demoConfig: {
    forceOutcome: "success" | "fail_kyc" | "fail_payment" | "auto";
    webhookDelayMs: number;
  };
}

const store: Store = {
  orders: new Map(),
  wallets: new Map(),
  plans: new Map(),
  workflows: new Map(),
  notifications: new Map(),
  events: [],
  firstExecutionTimes: new Map(),
  sessionStartTimes: new Map(),
  demoConfig: {
    forceOutcome: "auto",
    webhookDelayMs: 2000,
  },
};

export function getStore(): Store {
  return store;
}

export function resetStore(): void {
  store.orders.clear();
  store.wallets.clear();
  store.plans.clear();
  store.workflows.clear();
  store.notifications.clear();
  store.events.length = 0;
  store.firstExecutionTimes.clear();
  store.sessionStartTimes.clear();
  store.demoConfig.forceOutcome = "auto";
  store.demoConfig.webhookDelayMs = 2000;
}

let idCounter = 0;
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}
