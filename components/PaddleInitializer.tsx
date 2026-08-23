"use client";

import { useEffect } from "react";
import { initializePaddle } from "@paddle/paddle-js";

export function PaddleInitializer() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!token) {
      console.error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured.");
      return;
    }

    void initializePaddle({
      environment: "sandbox",
      token,
    });
  }, []);

  return null;
}