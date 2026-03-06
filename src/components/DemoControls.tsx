"use client";

import { useState } from "react";

type Outcome = "auto" | "success" | "fail_kyc" | "fail_payment";

const OUTCOMES: { id: Outcome; label: string; color: string }[] = [
  { id: "auto", label: "Auto (Success)", color: "bg-success/20 text-success" },
  { id: "fail_kyc", label: "Fail: KYC Pending", color: "bg-warning/20 text-warning" },
  { id: "fail_payment", label: "Fail: Payment Declined", color: "bg-danger/20 text-danger" },
];

interface Props {
  onReset: () => void;
}

export default function DemoControls({ onReset }: Props) {
  const [outcome, setOutcome] = useState<Outcome>("auto");
  const [collapsed, setCollapsed] = useState(false);

  const handleOutcome = async (o: Outcome) => {
    setOutcome(o);
    await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_demo_config",
        forceOutcome: o,
      }),
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-warning">
            Demo Controls
          </span>
          <span className="text-xs text-muted">(visible only in PoC)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="rounded-md border border-card-border px-3 py-1 text-xs text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Reset Demo
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-muted hover:text-foreground"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Webhook outcome:</span>
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              onClick={() => handleOutcome(o.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                outcome === o.id
                  ? `${o.color} ring-1 ring-current`
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
