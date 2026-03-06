import { getStore, generateId } from "../store";
import { trackEvent } from "./metrics";
import type { Order, OrderStatus, FailureCode } from "../types";

export function createOrder(userId: string, amount: number): Order {
  const store = getStore();
  const order: Order = {
    id: generateId("ord"),
    userId,
    amount,
    currency: "USDC",
    status: "created",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.orders.set(order.id, order);

  trackEvent({
    name: "moonpay_checkout_created",
    userId,
    sessionId: userId,
    orderId: order.id,
  });

  // Record session start for TTFV calculation
  if (!store.sessionStartTimes.has(userId)) {
    store.sessionStartTimes.set(userId, Date.now());
  }

  return order;
}

export function getOrder(orderId: string): Order | undefined {
  return getStore().orders.get(orderId);
}

/**
 * Transition order through the state machine.
 * Returns false if the transition is invalid or a no-op (idempotent).
 */
export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  failureCode?: FailureCode
): { updated: boolean; order: Order | undefined } {
  const store = getStore();
  const order = store.orders.get(orderId);
  if (!order) return { updated: false, order: undefined };

  // Idempotent: already at target status
  if (order.status === newStatus) {
    return { updated: false, order };
  }

  // Terminal state guard: success and failed are terminal
  if (order.status === "success" || order.status === "failed") {
    return { updated: false, order };
  }

  // Valid transitions
  const valid =
    (order.status === "created" &&
      (newStatus === "pending" ||
        newStatus === "success" ||
        newStatus === "failed")) ||
    (order.status === "pending" &&
      (newStatus === "success" || newStatus === "failed"));

  if (!valid) return { updated: false, order };

  order.status = newStatus;
  order.failureCode = failureCode;
  order.updatedAt = Date.now();

  if (newStatus === "success") {
    creditWallet(order.userId, order.amount);
    trackEvent({
      name: "deposit_success",
      userId: order.userId,
      sessionId: order.userId,
      orderId,
    });
  } else if (newStatus === "failed") {
    trackEvent({
      name: "deposit_failed",
      userId: order.userId,
      sessionId: order.userId,
      orderId,
      errorCode: failureCode,
    });
  }

  return { updated: true, order };
}

function creditWallet(userId: string, amount: number): void {
  const store = getStore();
  const existing = store.wallets.get(userId);
  if (existing) {
    existing.available += amount;
    existing.updatedAt = Date.now();
  } else {
    store.wallets.set(userId, {
      userId,
      available: amount,
      currency: "USDC",
      updatedAt: Date.now(),
    });
  }
}

export function getWalletBalance(userId: string): number {
  return getStore().wallets.get(userId)?.available ?? 0;
}
