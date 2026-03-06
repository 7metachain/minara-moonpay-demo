import { trackEvent } from "./metrics";
import { updateOrderStatus, getOrder } from "./deposit";
import type { OrderStatus, FailureCode } from "../types";

/**
 * Stub signature verification — production would use MoonPay's webhook secret.
 * Framework is preserved so it's easy to plug in real verification later.
 */
function verifySignature(_signature: string, _body: string): boolean {
  return true;
}

export interface WebhookPayload {
  orderId: string;
  status: OrderStatus;
  failureCode?: FailureCode;
  signature?: string;
}

export interface WebhookResult {
  accepted: boolean;
  reason: string;
  idempotent: boolean;
}

export function handleWebhook(payload: WebhookPayload): WebhookResult {
  const { orderId, status, failureCode, signature } = payload;

  // Signature check (stubbed)
  if (signature !== undefined && !verifySignature(signature, orderId)) {
    return { accepted: false, reason: "Invalid signature", idempotent: false };
  }

  const order = getOrder(orderId);
  if (!order) {
    return { accepted: false, reason: "Order not found", idempotent: false };
  }

  trackEvent({
    name: "moonpay_webhook_received",
    userId: order.userId,
    sessionId: order.userId,
    orderId,
  });

  const { updated, order: updatedOrder } = updateOrderStatus(
    orderId,
    status,
    failureCode
  );

  if (!updated && updatedOrder) {
    // Idempotent: order already in this state or a later state
    return {
      accepted: true,
      reason: `Order already at status: ${updatedOrder.status}`,
      idempotent: true,
    };
  }

  if (!updatedOrder) {
    return { accepted: false, reason: "Order not found", idempotent: false };
  }

  return { accepted: true, reason: "OK", idempotent: false };
}
