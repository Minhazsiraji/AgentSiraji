"use client";

import { useEffect } from "react";
import { initializePaddle } from "@paddle/paddle-js";

export function PaddleInitializer() {
  useEffect(() => {
    let cancelled = false;

    async function startPaddle() {
      const token =
        process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

      if (!token) {
        console.error(
          "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured.",
        );
        return;
      }

      try {
        const paddle = await initializePaddle({
          environment: "sandbox",
          token,
        });

        if (cancelled || !paddle) {
          return;
        }

        const url = new URL(window.location.href);
        const transactionId =
          url.searchParams.get("_ptxn")?.trim() ?? "";

        if (!transactionId) {
          return;
        }

        if (!transactionId.startsWith("txn_")) {
          console.error(
            "Invalid Paddle transaction ID in checkout URL.",
          );
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
      } catch (error) {
        console.error(
          "Paddle checkout initialization failed.",
          error,
        );
      }
    }

    void startPaddle();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}