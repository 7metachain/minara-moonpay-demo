import { getStore, generateId } from "../store";
import { trackEvent } from "./metrics";
import type { ExecutionPlan, Workflow, PlanStep, RiskControls } from "../types";

const STARTER_PROMPT = `I just deposited USDC via MoonPay. Create a low-risk starter plan: buy $20 ETH in 2 batches, max once today, and send me a Telegram notification. Ask for confirmation before executing.`;

const DEFAULT_STEPS: PlanStep[] = [
  {
    index: 0,
    action: "BUY",
    amount: 10,
    token: "ETH",
    description: "Buy $10 ETH — batch 1 of 2",
  },
  {
    index: 1,
    action: "BUY",
    amount: 10,
    token: "ETH",
    description: "Buy $10 ETH — batch 2 of 2 (next available window)",
  },
];

const DEFAULT_RISK_CONTROLS: RiskControls = {
  maxAmountPerTrade: 10,
  maxTradesPerDay: 1,
  requireConfirmation: true,
  notificationChannel: "telegram",
};

export function generatePlan(
  userId: string,
  orderId: string
): ExecutionPlan {
  const store = getStore();
  const plan: ExecutionPlan = {
    id: generateId("plan"),
    orderId,
    userId,
    prompt: STARTER_PROMPT,
    steps: DEFAULT_STEPS,
    riskControls: DEFAULT_RISK_CONTROLS,
    createdAt: Date.now(),
  };
  store.plans.set(plan.id, plan);

  trackEvent({
    name: "plan_generated",
    userId,
    sessionId: userId,
    orderId,
  });

  return plan;
}

export function getPlan(planId: string): ExecutionPlan | undefined {
  return getStore().plans.get(planId);
}

export function confirmExecution(
  planId: string
): { workflow: Workflow; plan: ExecutionPlan } | null {
  const store = getStore();
  const plan = store.plans.get(planId);
  if (!plan) return null;

  trackEvent({
    name: "execution_confirmed",
    userId: plan.userId,
    sessionId: plan.userId,
    orderId: plan.orderId,
  });

  const workflow: Workflow = {
    id: generateId("wf"),
    planId,
    userId: plan.userId,
    status: "active",
    executionResults: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.workflows.set(workflow.id, workflow);

  trackEvent({
    name: "workflow_created",
    userId: plan.userId,
    sessionId: plan.userId,
    orderId: plan.orderId,
  });

  // Simulate first execution (batch 1)
  const firstStep = plan.steps[0];
  workflow.executionResults.push({
    stepIndex: firstStep.index,
    status: "filled",
    filledAt: Date.now(),
    details: `Simulated: ${firstStep.description} at market price`,
  });
  workflow.updatedAt = Date.now();

  // Record first-execution time for TTFV
  if (!store.firstExecutionTimes.has(plan.userId)) {
    store.firstExecutionTimes.set(plan.userId, Date.now());
  }

  trackEvent({
    name: "first_execution_filled",
    userId: plan.userId,
    sessionId: plan.userId,
    orderId: plan.orderId,
  });

  // Deduct from wallet
  const wallet = store.wallets.get(plan.userId);
  if (wallet) {
    wallet.available = Math.max(0, wallet.available - firstStep.amount);
    wallet.updatedAt = Date.now();
  }

  return { workflow, plan };
}

export function getWorkflow(workflowId: string): Workflow | undefined {
  return getStore().workflows.get(workflowId);
}
