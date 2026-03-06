import { getStore } from "../store";
import type { AnalyticsEvent, EventName, FunnelMetrics, KPIs } from "../types";

export function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp" | "channel">
): void {
  const store = getStore();
  store.events.push({
    ...event,
    timestamp: Date.now(),
    channel: "moonpay",
  });
}

export function getFunnelMetrics(): FunnelMetrics {
  const { events } = getStore();
  const count = (name: EventName) =>
    events.filter((e) => e.name === name).length;

  return {
    deposit_clicked: count("deposit_clicked"),
    moonpay_checkout_created: count("moonpay_checkout_created"),
    deposit_success: count("deposit_success"),
    deposit_failed: count("deposit_failed"),
    plan_generated: count("plan_generated"),
    execution_confirmed: count("execution_confirmed"),
    workflow_created: count("workflow_created"),
    first_execution_filled: count("first_execution_filled"),
    notification_sent: count("notification_sent"),
    notification_failed: count("notification_failed"),
  };
}

export function getFailureBreakdown(): Record<string, number> {
  const { events } = getStore();
  const failures = events.filter((e) => e.errorCode);
  const breakdown: Record<string, number> = {};
  for (const e of failures) {
    breakdown[e.errorCode!] = (breakdown[e.errorCode!] || 0) + 1;
  }
  return breakdown;
}

export function getKPIs(): KPIs {
  const funnel = getFunnelMetrics();
  const store = getStore();

  const depositTotal = funnel.deposit_success + funnel.deposit_failed;
  const depositConversionRate =
    depositTotal > 0 ? funnel.deposit_success / depositTotal : 0;

  const executionCompletionRate =
    funnel.plan_generated > 0
      ? funnel.first_execution_filled / funnel.plan_generated
      : 0;

  const notifTotal = funnel.notification_sent + funnel.notification_failed;
  const notificationDeliveryRate =
    notifTotal > 0 ? funnel.notification_sent / notifTotal : 0;

  // TTFV: median time from session start to first execution
  const ttfvValues: number[] = [];
  for (const [userId, execTime] of store.firstExecutionTimes) {
    const sessionStart = store.sessionStartTimes.get(userId);
    if (sessionStart) {
      ttfvValues.push(execTime - sessionStart);
    }
  }
  ttfvValues.sort((a, b) => a - b);
  const medianTTFV =
    ttfvValues.length > 0
      ? ttfvValues[Math.floor(ttfvValues.length / 2)]
      : null;

  return {
    depositConversionRate,
    medianTTFV,
    executionCompletionRate,
    notificationDeliveryRate,
  };
}

export function getAllEvents(): AnalyticsEvent[] {
  return [...getStore().events];
}
