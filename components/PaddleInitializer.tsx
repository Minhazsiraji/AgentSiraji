"use client";

import { useEffect, useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";

export function PaddleInitializer() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function startPaddle() {
      const token =
        process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

      const url = new URL(window.location.href);
      const transactionId =
        url.searchParams.get("_ptxn")?.trim() ?? "";

      if (!transactionId) {
        return;
      }

      if (!token) {
        if (active) {
          setStatus(
            "Paddle diagnostic: client-side token is missing.",
          );
        }
        return;
      }

      if (!token.startsWith("test_")) {
        if (active) {
          setStatus(
            "Paddle diagnostic: Preview is not using a sandbox test_ client token.",
          );
        }
        return;
      }

      if (!transactionId.startsWith("txn_")) {
        if (active) {
          setStatus(
            "Paddle diagnostic: invalid transaction ID.",
          );
        }
        return;
      }

      try {
        if (active) {
          setStatus(
            "Paddle diagnostic: initializing sandbox checkout...",
          );
        }

        const paddle = await initializePaddle({
          environment: "sandbox",
          token,
        });

        if (!active) {
          return;
        }

        if (!paddle) {
          setStatus(
            "Paddle diagnostic: Paddle.js returned no client instance.",
          );
          return;
        }

        setStatus(
          "Paddle diagnostic: Paddle initialized. Opening checkout...",
        );

        await new Promise((resolve) =>
          window.setTimeout(resolve, 300),
        );

        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "en",
          },
        });

        setStatus(
          "Paddle diagnostic: checkout open command sent.",
        );
      } catch (error) {
        console.error(
          "Paddle checkout initialization failed.",
          error,
        );

        if (active) {
          setStatus(
            `Paddle diagnostic error: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`,
          );
        }
      }
    }

    void startPaddle();

    return () => {
      active = false;
    };
  }, []);

  if (!status) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: "16px",
        bottom: "16px",
        zIndex: 999999,
        maxWidth: "520px",
        padding: "12px 16px",
        borderRadius: "10px",
        background: "#ffffff",
        border: "1px solid #d7deea",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        fontSize: "13px",
        lineHeight: 1.4,
        color: "#10234d",
      }}
    >
      {status}
    </div>
  );
}