export type OrderStatus = "created" | "pending" | "success" | "failed";

export type ExperienceStage =
  | "deposit_success"
  | "prompt_ready"
  | "plan_generated"
  | "confirmed"
  | "workflow_active"
  | "notified";

export type FailureCode =
  | "KYC_PENDING"
  | "PAYMENT_FAILED"
  | "DEPOSIT_TIMEOUT"
  | "EXECUTION_FAILED"
  | "NOTIFICATION_FAILED";

export interface Order {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  failureCode?: FailureCode;
  createdAt: number;
  updatedAt: number;
}

export interface WalletBalance {
  userId: string;
  available: number;
  currency: string;
  updatedAt: number;
}

export interface ExecutionPlan {
  id: string;
  orderId: string;
  userId: string;
  prompt: string;
  steps: PlanStep[];
  riskControls: RiskControls;
  createdAt: number;
}

export interface PlanStep {
  index: number;
  action: string;
  amount: number;
  token: string;
  description: string;
}

export interface RiskControls {
  maxAmountPerTrade: number;
  maxTradesPerDay: number;
  requireConfirmation: boolean;
  notificationChannel: string;
}

export interface Workflow {
  id: string;
  planId: string;
  userId: string;
  status: "active" | "paused" | "completed";
  executionResults: ExecutionResult[];
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionResult {
  stepIndex: number;
  status: "filled" | "failed";
  filledAt: number;
  details: string;
}

export interface Notification {
  id: string;
  userId: string;
  workflowId: string;
  channel: string;
  message: string;
  status: "sent" | "failed";
  attempts: number;
  sentAt: number;
}

export type EventName =
  | "deposit_clicked"
  | "moonpay_checkout_created"
  | "moonpay_webhook_received"
  | "deposit_success"
  | "deposit_failed"
  | "starter_prompt_shown"
  | "plan_generated"
  | "execution_confirmed"
  | "workflow_created"
  | "first_execution_filled"
  | "notification_sent"
  | "notification_failed";

export interface AnalyticsEvent {
  name: EventName;
  userId: string;
  sessionId: string;
  orderId?: string;
  timestamp: number;
  channel: "moonpay";
  errorCode?: string;
}

export interface FunnelMetrics {
  deposit_clicked: number;
  moonpay_checkout_created: number;
  deposit_success: number;
  deposit_failed: number;
  plan_generated: number;
  execution_confirmed: number;
  workflow_created: number;
  first_execution_filled: number;
  notification_sent: number;
  notification_failed: number;
}

export interface KPIs {
  depositConversionRate: number;
  medianTTFV: number | null;
  executionCompletionRate: number;
  notificationDeliveryRate: number;
}
