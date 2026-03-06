"use client";

import StatusBadge from "./StatusBadge";
import type { Workflow, Notification } from "@/lib/types";

interface Props {
  workflow: Workflow;
  notification: Notification;
  walletBalance: number;
}

export default function NotificationStep({
  workflow,
  notification,
  walletBalance,
}: Props) {
  const exec = workflow.executionResults[0];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-card-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Workflow Active</h4>
          <StatusBadge status={workflow.status} />
        </div>
        <p className="text-xs font-mono text-muted">{workflow.id}</p>

        {exec && (
          <div className="rounded-md bg-success/10 px-3 py-2">
            <p className="text-xs font-medium text-success">
              First Execution: {exec.status.toUpperCase()}
            </p>
            <p className="text-xs text-muted">{exec.details}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-card-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notification</h4>
          <StatusBadge status={notification.status} />
        </div>
        <p className="text-xs text-muted">Channel: {notification.channel}</p>
        <p className="text-xs text-muted">
          Attempts: {notification.attempts}
        </p>
        <div className="rounded-md bg-background px-3 py-2">
          <p className="text-xs font-mono text-foreground/80">
            {notification.message}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-card-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Wallet Balance</span>
          <span className="text-lg font-bold text-success">
            ${walletBalance.toFixed(2)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}
