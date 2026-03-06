"use client";

import { useState, useEffect, useCallback } from "react";
import type { FunnelMetrics, KPIs, AnalyticsEvent } from "@/lib/types";

interface MetricsData {
  funnel: FunnelMetrics;
  failures: Record<string, number>;
  kpis: KPIs;
  events: AnalyticsEvent[];
}

const FUNNEL_STAGES: { key: keyof FunnelMetrics; label: string }[] = [
  { key: "deposit_clicked", label: "Deposit Clicked" },
  { key: "moonpay_checkout_created", label: "Checkout Created" },
  { key: "deposit_success", label: "Deposit Success" },
  { key: "plan_generated", label: "Plan Generated" },
  { key: "execution_confirmed", label: "Execution Confirmed" },
  { key: "first_execution_filled", label: "First Execution" },
  { key: "notification_sent", label: "Notification Sent" },
];

export default function MetricsDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);

  const fetchMetrics = useCallback(async () => {
    const res = await fetch("/api/poc/metrics");
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (!data) {
    return (
      <div className="flex items-center gap-3 p-6">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-sm text-muted">Loading metrics...</span>
      </div>
    );
  }

  const maxFunnel = Math.max(
    ...FUNNEL_STAGES.map((s) => data.funnel[s.key]),
    1
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Funnel Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Deposit Conversion"
          value={`${(data.kpis.depositConversionRate * 100).toFixed(0)}%`}
          sub={`${data.funnel.deposit_success} / ${data.funnel.deposit_success + data.funnel.deposit_failed} deposits`}
        />
        <KPICard
          label="Median TTFV"
          value={
            data.kpis.medianTTFV !== null
              ? `${(data.kpis.medianTTFV / 1000).toFixed(1)}s`
              : "N/A"
          }
          sub="Login to first execution"
        />
        <KPICard
          label="Execution Rate"
          value={`${(data.kpis.executionCompletionRate * 100).toFixed(0)}%`}
          sub={`${data.funnel.first_execution_filled} / ${data.funnel.plan_generated} plans`}
        />
        <KPICard
          label="Notification Delivery"
          value={`${(data.kpis.notificationDeliveryRate * 100).toFixed(0)}%`}
          sub={`${data.funnel.notification_sent} sent, ${data.funnel.notification_failed} failed`}
        />
      </div>

      {/* Funnel Chart */}
      <div className="rounded-lg border border-card-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Conversion Funnel</h3>
        <div className="space-y-2">
          {FUNNEL_STAGES.map((stage) => {
            const count = data.funnel[stage.key];
            const pct = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-muted text-right">
                  {stage.label}
                </span>
                <div className="flex-1 h-6 rounded-md bg-background overflow-hidden">
                  <div
                    className="h-full rounded-md bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-xs font-mono text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Breakdown */}
      <div className="rounded-lg border border-card-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Failure Breakdown</h3>
        {Object.keys(data.failures).length === 0 ? (
          <p className="text-xs text-muted">No failures recorded yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border text-left text-muted">
                <th className="pb-2">Error Code</th>
                <th className="pb-2 text-right">Count</th>
                <th className="pb-2 text-right">% of Failures</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.failures)
                .sort(([, a], [, b]) => b - a)
                .map(([code, count]) => {
                  const total = Object.values(data.failures).reduce(
                    (s, v) => s + v,
                    0
                  );
                  return (
                    <tr key={code} className="border-b border-card-border/50">
                      <td className="py-1.5 font-mono text-danger">{code}</td>
                      <td className="py-1.5 text-right">{count}</td>
                      <td className="py-1.5 text-right">
                        {((count / total) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Event Log */}
      <div className="rounded-lg border border-card-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Event Log ({data.events.length} events)
        </h3>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {data.events.length === 0 ? (
            <p className="text-xs text-muted">No events yet.</p>
          ) : (
            [...data.events].reverse().map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded px-2 py-1 text-xs hover:bg-background"
              >
                <span className="w-16 shrink-0 text-muted font-mono">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-medium ${
                    e.name.includes("fail") || e.name.includes("failed")
                      ? "text-danger"
                      : e.name.includes("success") ||
                          e.name.includes("sent") ||
                          e.name.includes("filled")
                        ? "text-success"
                        : "text-foreground"
                  }`}
                >
                  {e.name}
                </span>
                {e.orderId && (
                  <span className="text-muted font-mono">{e.orderId}</span>
                )}
                {e.errorCode && (
                  <span className="text-danger font-mono">{e.errorCode}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={fetchMetrics}
        className="rounded-md border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
      >
        Refresh Metrics
      </button>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-card p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}
