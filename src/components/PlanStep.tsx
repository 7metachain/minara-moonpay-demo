"use client";

import { useState } from "react";
import type { ExecutionPlan, Workflow, Notification } from "@/lib/types";

interface Props {
  orderId: string;
  onPlanGenerated: (plan: ExecutionPlan) => void;
  onExecuted: (workflow: Workflow, notification: Notification, balance: number) => void;
}

export default function PlanStep({ orderId, onPlanGenerated, onExecuted }: Props) {
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleGeneratePlan = async () => {
    setLoading(true);
    const res = await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_plan", orderId }),
    });
    const data = await res.json();
    setPlan(data.plan);
    onPlanGenerated(data.plan);
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!plan) return;
    setConfirming(true);
    const res = await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_execution", planId: plan.id }),
    });
    const data = await res.json();
    onExecuted(data.workflow, data.notification, data.walletBalance);
    setConfirming(false);
  };

  if (!plan) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-4">
          <p className="text-sm font-medium text-accent-light mb-1">Recommended Starter Prompt</p>
          <p className="text-xs text-muted italic">
            &quot;I just deposited USDC via MoonPay. Create a low-risk starter plan:
            buy $20 ETH in 2 batches, max once today, and send me a Telegram
            notification. Ask for confirmation before executing.&quot;
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Execution Plan"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-card-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Execution Plan</h4>
          <span className="text-xs font-mono text-muted">{plan.id}</span>
        </div>

        <div className="space-y-2">
          {plan.steps.map((step) => (
            <div
              key={step.index}
              className="flex items-center gap-3 rounded-md bg-background px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent-light">
                {step.index + 1}
              </span>
              <div>
                <p className="text-xs font-medium">
                  {step.action} ${step.amount} {step.token}
                </p>
                <p className="text-xs text-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-card-border pt-3">
          <p className="text-xs font-semibold text-muted mb-1">Risk Controls</p>
          <ul className="text-xs text-muted space-y-0.5">
            <li>Max per trade: ${plan.riskControls.maxAmountPerTrade}</li>
            <li>Max trades/day: {plan.riskControls.maxTradesPerDay}</li>
            <li>Confirmation required: {plan.riskControls.requireConfirmation ? "Yes" : "No"}</li>
            <li>Notification: {plan.riskControls.notificationChannel}</li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="w-full rounded-md bg-success px-4 py-2.5 text-sm font-medium text-white hover:bg-success/80 disabled:opacity-50"
      >
        {confirming ? "Executing..." : "Confirm & Execute First Trade"}
      </button>
    </div>
  );
}
