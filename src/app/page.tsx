"use client";

import { useState, useCallback } from "react";
import DepositStep from "@/components/DepositStep";
import PlanStep from "@/components/PlanStep";
import NotificationStep from "@/components/NotificationStep";
import DemoControls from "@/components/DemoControls";
import MetricsDashboard from "@/components/MetricsDashboard";
import type { ExecutionPlan, Workflow, Notification } from "@/lib/types";

type WizardStep = "deposit" | "plan" | "execution" | "metrics";

const STEPS: { id: WizardStep; label: string; num: number }[] = [
  { id: "deposit", label: "Deposit USDC", num: 1 },
  { id: "plan", label: "Plan & Execute", num: 2 },
  { id: "execution", label: "Result & Notify", num: 3 },
  { id: "metrics", label: "Funnel Dashboard", num: 4 },
];

export default function Home() {
  const [step, setStep] = useState<WizardStep>("deposit");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [, setPlan] = useState<ExecutionPlan | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [failInfo, setFailInfo] = useState<{ orderId: string; code: string } | null>(null);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  const handleDepositSuccess = useCallback((oid: string, balance: number) => {
    setOrderId(oid);
    setWalletBalance(balance);
    setFailInfo(null);
    setStep("plan");
  }, []);

  const handleDepositFail = useCallback((oid: string, code: string) => {
    setFailInfo({ orderId: oid, code });
  }, []);

  const handlePlanGenerated = useCallback((p: ExecutionPlan) => {
    setPlan(p);
  }, []);

  const handleExecuted = useCallback(
    (wf: Workflow, notif: Notification, balance: number) => {
      setWorkflow(wf);
      setNotification(notif);
      setWalletBalance(balance);
      setEndTime(Date.now());
      setStep("execution");
    },
    []
  );

  const handleReset = async () => {
    await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    setStep("deposit");
    setOrderId(null);
    setWalletBalance(0);
    setPlan(null);
    setWorkflow(null);
    setNotification(null);
    setFailInfo(null);
    setEndTime(null);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Card-to-Autopilot PoC
              </h1>
              <p className="text-sm text-muted">
                Minara x MoonPay — deposit to workflow in one flow
              </p>
            </div>
            {endTime && (
              <div className="text-right">
                <p className="text-xs text-muted">End-to-end time</p>
                <p className="text-lg font-bold text-success">
                  {((endTime - startTime) / 1000).toFixed(1)}s
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <DemoControls onReset={handleReset} />

        {/* Step indicator */}
        <nav className="mb-8 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  if (i <= currentStepIndex || s.id === "metrics") setStep(s.id);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  step === s.id
                    ? "bg-accent text-white"
                    : i < currentStepIndex
                      ? "bg-success/20 text-success cursor-pointer"
                      : "bg-card text-muted"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === s.id
                      ? "bg-white/20"
                      : i < currentStepIndex
                        ? "bg-success/30"
                        : "bg-card-border"
                  }`}
                >
                  {i < currentStepIndex ? "\u2713" : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px w-6 ${
                    i < currentStepIndex ? "bg-success" : "bg-card-border"
                  }`}
                />
              )}
            </div>
          ))}
        </nav>

        {/* Step content */}
        <div className="rounded-xl border border-card-border bg-card/50 p-6">
          {step === "deposit" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Step 1: Buy USDC with Credit Card
              </h2>
              <p className="mb-4 text-sm text-muted">
                Simulate a MoonPay credit card deposit. The sandbox webhook will
                fire automatically after a short delay.
              </p>
              <DepositStep
                onSuccess={handleDepositSuccess}
                onFail={handleDepositFail}
              />
              {failInfo && (
                <p className="mt-3 text-xs text-muted">
                  Use Demo Controls above to switch between success and failure
                  scenarios, then retry.
                </p>
              )}
            </div>
          )}

          {step === "plan" && orderId && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Step 2: AI Starter Prompt & Execution Plan
              </h2>
              <p className="mb-4 text-sm text-muted">
                Deposit confirmed! The system recommends a low-risk starter prompt.
                Review the plan and confirm to execute.
              </p>
              <PlanStep
                orderId={orderId}
                onPlanGenerated={handlePlanGenerated}
                onExecuted={handleExecuted}
              />
            </div>
          )}

          {step === "execution" && workflow && notification && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Step 3: Execution Result & Notification
              </h2>
              <p className="mb-4 text-sm text-muted">
                The first trade has been executed and a notification was sent.
              </p>
              <NotificationStep
                workflow={workflow}
                notification={notification}
                walletBalance={walletBalance}
              />
              <button
                onClick={() => setStep("metrics")}
                className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light"
              >
                View Funnel Dashboard
              </button>
            </div>
          )}

          {step === "metrics" && <MetricsDashboard />}
        </div>
      </main>

      <footer className="border-t border-card-border py-6 text-center text-xs text-muted">
        Card-to-Autopilot PoC — Minara x MoonPay Integration Demo
      </footer>
    </div>
  );
}
