"use client";

import { useEffect, useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";

type CheckoutState =
  | "idle"
  | "opening"
  | "verifying"
  | "active"
  | "delayed"
  | "error";

const STORAGE_KEY = "agentsiraji:paddle-transaction";

function updateCheckoutUrl(payment: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete("_ptxn");
  url.searchParams.set("payment", payment);
  window.history.replaceState({}, "", url.toString());
}

export function PaddleInitializer() {
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;

    async function pollForActivation(transactionId: string) {
      if (!active) return;

      setState("verifying");
      setMessage("Payment received. Verifying your subscription…");

      for (let attempt = 0; attempt < 30 && active; attempt += 1) {
        try {
          const response = await fetch(
            `/api/payments/paddle/status?transactionId=${encodeURIComponent(transactionId)}`,
            { cache: "no-store" },
          );

          if (response.ok) {
            const payload = (await response.json()) as { active?: boolean };

            if (payload.active) {
              sessionStorage.removeItem(STORAGE_KEY);
              updateCheckoutUrl("verified");
              setState("active");
              setMessage("Payment verified. Your Commerce subscription is active.");
              return;
            }
          }
        } catch (error) {
          console.error("Paddle status polling failed", error);
        }

        await new Promise<void>((resolve) => {
          pollTimer = window.setTimeout(resolve, 1000);
        });
      }

      if (active) {
        setState("delayed");
        setMessage(
          "Payment was received. Verification is taking longer than expected; access will activate only after the verified Paddle event arrives.",
        );
      }
    }

    async function startPaddle() {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const url = new URL(window.location.href);
      const transactionFromUrl = url.searchParams.get("_ptxn")?.trim() ?? "";
      const storedTransaction = sessionStorage.getItem(STORAGE_KEY) ?? "";
      const transactionId = transactionFromUrl || storedTransaction;

      if (!transactionId) return;

      if (!transactionId.startsWith("txn_")) {
        sessionStorage.removeItem(STORAGE_KEY);
        setState("error");
        setMessage("The Paddle transaction reference is invalid.");
        return;
      }

      if (!transactionFromUrl) {
        void pollForActivation(transactionId);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, transactionId);
      updateCheckoutUrl("pending");

      if (!token || !token.startsWith("test_")) {
        setState("error");
        setMessage("Paddle sandbox checkout is not configured correctly.");
        return;
      }

      try {
        setState("opening");
        setMessage("Opening secure Paddle checkout…");

        const paddle = await initializePaddle({
          environment: "sandbox",
          token,
        });

        if (!active || !paddle) {
          if (active) {
            setState("error");
            setMessage("Paddle checkout could not be initialized.");
          }
          return;
        }

        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "en",
          },
        });

        void pollForActivation(transactionId);
      } catch (error) {
        console.error("Paddle checkout initialization failed", error);
        if (active) {
          setState("error");
          setMessage(
            error instanceof Error
              ? `Paddle checkout could not open: ${error.message}`
              : "Paddle checkout could not open.",
          );
        }
      }
    }

    void startPaddle();

    return () => {
      active = false;
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        zIndex: 999999,
        width: "min(560px, calc(100vw - 32px))",
        padding: "14px 18px",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.96)",
        border: "1px solid rgba(16, 35, 77, 0.14)",
        boxShadow: "0 14px 40px rgba(16, 35, 77, 0.18)",
        backdropFilter: "blur(14px)",
        fontSize: "14px",
        lineHeight: 1.45,
        color: "#10234d",
        textAlign: "center",
      }}
    >
      <strong>
        {state === "active"
          ? "Payment verified"
          : state === "verifying"
            ? "Verifying payment"
            : state === "opening"
              ? "Secure checkout"
              : state === "delayed"
                ? "Verification pending"
                : "Checkout notice"}
      </strong>
      <div style={{ marginTop: "4px" }}>{message}</div>
    </div>
  );
}
