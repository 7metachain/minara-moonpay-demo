"use client";

import { useState, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge";

interface Props {
  onSuccess: (orderId: string, balance: number) => void;
  onFail: (orderId: string, code: string) => void;
}

export default function DepositStep({ onSuccess, onFail }: Props) {
  const [amount, setAmount] = useState(50);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [failureCode, setFailureCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pollOrder = useCallback(async (oid: string) => {
    const res = await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "poll_order", orderId: oid }),
    });
    const data = await res.json();
    setStatus(data.status);
    if (data.status === "success") {
      onSuccess(oid, data.walletBalance);
    } else if (data.status === "failed") {
      setFailureCode(data.failureCode);
      onFail(oid, data.failureCode);
    }
    return data.status;
  }, [onSuccess, onFail]);

  useEffect(() => {
    if (!orderId || status === "success" || status === "failed") return;
    const interval = setInterval(async () => {
      const s = await pollOrder(orderId);
      if (s === "success" || s === "failed") clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [orderId, status, pollOrder]);

  const handleDeposit = async () => {
    setLoading(true);
    setStatus("idle");
    setFailureCode(null);
    const res = await fetch("/api/poc/card-to-autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deposit", amount }),
    });
    const data = await res.json();
    setOrderId(data.orderId);
    setStatus("created");
    setLoading(false);
  };

  const failureHints: Record<string, string> = {
    KYC_PENDING: "Identity verification is pending. Please complete KYC on the MoonPay portal, then retry.",
    PAYMENT_FAILED: "Card payment was declined. Try a different card or payment method.",
    DEPOSIT_TIMEOUT: "The deposit timed out. Please try again.",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm text-muted">Amount (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-24 rounded-md border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          min={10}
          max={1000}
        />
        <button
          onClick={handleDeposit}
          disabled={loading || (status !== "idle" && status !== "failed")}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {loading ? "Processing..." : "Buy USDC with Card"}
        </button>
      </div>

      {orderId && (
        <div className="rounded-lg border border-card-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-mono">{orderId}</span>
            <StatusBadge status={status} />
          </div>

          {status === "created" && (
            <p className="text-xs text-muted">
              Order created. Waiting for MoonPay webhook...
            </p>
          )}
          {status === "pending" && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-warning border-t-transparent" />
              <p className="text-xs text-warning">Payment processing...</p>
            </div>
          )}
          {status === "success" && (
            <p className="text-xs text-success">
              Deposit successful! ${amount} USDC credited to your wallet.
            </p>
          )}
          {status === "failed" && failureCode && (
            <div className="space-y-1">
              <p className="text-xs text-danger">
                Deposit failed: {failureCode}
              </p>
              <p className="text-xs text-muted">
                {failureHints[failureCode] ?? "An unknown error occurred."}
              </p>
              <button
                onClick={() => { setStatus("idle"); setOrderId(null); }}
                className="mt-2 rounded-md border border-card-border px-3 py-1 text-xs text-muted hover:text-foreground"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
