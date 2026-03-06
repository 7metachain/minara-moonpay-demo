import { getStore, generateId } from "../store";
import { trackEvent } from "./metrics";
import type { Notification } from "../types";

const MAX_RETRIES = 1;

/**
 * Mock Telegram notification sender.
 * In production, this would call the Telegram Bot API.
 */
function mockSendTelegram(message: string): boolean {
  // Simulate ~95% success rate for realism
  const success = Math.random() > 0.05;
  if (success) {
    console.log(`[Telegram Mock] Sent: ${message}`);
  } else {
    console.log(`[Telegram Mock] FAILED to send: ${message}`);
  }
  return success;
}

export function sendNotification(
  userId: string,
  workflowId: string,
  message: string
): Notification {
  const store = getStore();
  const notification: Notification = {
    id: generateId("notif"),
    userId,
    workflowId,
    channel: "telegram",
    message,
    status: "failed",
    attempts: 0,
    sentAt: Date.now(),
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    notification.attempts = attempt + 1;
    const success = mockSendTelegram(message);
    if (success) {
      notification.status = "sent";
      break;
    }
  }

  store.notifications.set(notification.id, notification);

  if (notification.status === "sent") {
    trackEvent({
      name: "notification_sent",
      userId,
      sessionId: userId,
    });
  } else {
    trackEvent({
      name: "notification_failed",
      userId,
      sessionId: userId,
      errorCode: "NOTIFICATION_FAILED",
    });
  }

  return notification;
}
