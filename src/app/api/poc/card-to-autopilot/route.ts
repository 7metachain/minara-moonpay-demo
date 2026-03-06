import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrder, getWalletBalance } from "@/lib/services/deposit";
import { handleWebhook } from "@/lib/services/webhook";
import { generatePlan, confirmExecution } from "@/lib/services/workflow";
import { sendNotification } from "@/lib/services/notification";
import { trackEvent } from "@/lib/services/metrics";
import { getStore, resetStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, userId = "demo_user", ...params } = body;

  switch (action) {
    case "deposit": {
      const amount = params.amount ?? 50;

      trackEvent({ name: "deposit_clicked", userId, sessionId: userId });

      const order = createOrder(userId, amount);

      // Auto-trigger simulated webhook after delay
      const store = getStore();
      const { forceOutcome, webhookDelayMs } = store.demoConfig;

      setTimeout(() => {
        if (forceOutcome === "fail_kyc") {
          handleWebhook({
            orderId: order.id,
            status: "failed",
            failureCode: "KYC_PENDING",
          });
        } else if (forceOutcome === "fail_payment") {
          handleWebhook({
            orderId: order.id,
            status: "failed",
            failureCode: "PAYMENT_FAILED",
          });
        } else {
          // "auto" or "success" -> first go pending, then success
          handleWebhook({ orderId: order.id, status: "pending" });
          setTimeout(() => {
            handleWebhook({ orderId: order.id, status: "success" });
          }, 500);
        }
      }, webhookDelayMs);

      return NextResponse.json({
        orderId: order.id,
        status: order.status,
        checkoutUrl: `https://buy-sandbox.moonpay.com/?currencyCode=usdc&baseCurrencyAmount=${amount}`,
        message: "Order created. Simulated webhook will fire shortly.",
      });
    }

    case "poll_order": {
      const order = getOrder(params.orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({
        orderId: order.id,
        status: order.status,
        failureCode: order.failureCode,
        walletBalance: getWalletBalance(userId),
      });
    }

    case "generate_plan": {
      trackEvent({
        name: "starter_prompt_shown",
        userId,
        sessionId: userId,
        orderId: params.orderId,
      });

      const plan = generatePlan(userId, params.orderId);
      return NextResponse.json({ plan });
    }

    case "confirm_execution": {
      const result = confirmExecution(params.planId);
      if (!result) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      const notification = sendNotification(
        userId,
        result.workflow.id,
        `Your first trade is live! Bought $${result.plan.steps[0].amount} ${result.plan.steps[0].token}. Workflow "${result.workflow.id}" is now active.`
      );

      return NextResponse.json({
        workflow: result.workflow,
        notification,
        walletBalance: getWalletBalance(userId),
      });
    }

    case "set_demo_config": {
      const store = getStore();
      if (params.forceOutcome !== undefined) {
        store.demoConfig.forceOutcome = params.forceOutcome;
      }
      if (params.webhookDelayMs !== undefined) {
        store.demoConfig.webhookDelayMs = params.webhookDelayMs;
      }
      return NextResponse.json({ demoConfig: store.demoConfig });
    }

    case "reset": {
      resetStore();
      return NextResponse.json({ message: "Store reset" });
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
}
