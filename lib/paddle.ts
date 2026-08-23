import { Environment, Paddle } from "@paddle/paddle-node-sdk";

type PaddleTransactionResponse = {
  data?: {
    id?: string;
    status?: string;
    checkout?: {
      url?: string | null;
    } | null;
  };
};

const paddleCatalog = {
  starter: {
    setupPriceId: "pri_01m0qvsbpt1g2q8pehnfyhbqcf",
    recurringPriceId: "pri_01m0qvqexnjhybzq6x1pkad7v3",
  },
} as const;

function getApiKey() {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not configured.");
  }

  if (process.env.PADDLE_ENV !== "sandbox") {
    throw new Error(
      "AgentSiraji Paddle integration is restricted to sandbox.",
    );
  }

  return apiKey;
}

export function getPaddleClient() {
  return new Paddle(getApiKey(), {
    environment: Environment.sandbox,
  });
}

export async function createPaddleSandboxTransaction(input: {
  paymentId: string;
  plan: string;
  setupAmount: number;
  recurringAmount: number;
  checkoutUrl: string;
}) {
  const apiKey = getApiKey();

  if (input.plan !== "starter") {
    throw new Error(
      "Only the Starter Paddle sandbox catalog is configured.",
    );
  }

  const catalog = paddleCatalog.starter;

  const response = await fetch(
    "https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            price_id: catalog.setupPriceId,
            quantity: 1,
          },
          {
            price_id: catalog.recurringPriceId,
            quantity: 1,
          },
        ],
        collection_mode: "automatic",
        enable_checkout: true,
        custom_data: {
          agentsiraji_payment_id: input.paymentId,
          agentsiraji_plan: input.plan,
          agentsiraji_setup_amount: input.setupAmount,
          agentsiraji_recurring_amount: input.recurringAmount,
        },
        checkout: {
          url: input.checkoutUrl,
        },
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as
    | PaddleTransactionResponse
    | {
        error?: {
          type?: string;
          code?: string;
          detail?: string;
          request_id?: string;
        };
      };

  if (!response.ok) {
    if ("error" in payload && payload.error) {
      const requestId = payload.error.request_id
        ? ` Request ID: ${payload.error.request_id}`
        : "";

      throw new Error(
        `${payload.error.code ?? "Paddle error"}: ${
          payload.error.detail ??
          "Paddle transaction creation failed."
        }${requestId}`,
      );
    }

    throw new Error(
      `Paddle transaction creation failed with ${response.status}.`,
    );
  }

  const data = (payload as PaddleTransactionResponse).data;

  if (!data?.id) {
    throw new Error(
      "Paddle did not return a sandbox transaction ID.",
    );
  }

  if (!data.checkout?.url) {
    throw new Error(
      "Paddle created the transaction but did not return a checkout URL.",
    );
  }

  return {
    transactionId: data.id,
    checkoutUrl: data.checkout.url,
  };
}

export async function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "PADDLE_WEBHOOK_SECRET is not configured.",
    );
  }

  const paddle = getPaddleClient();

  return paddle.webhooks.unmarshal(
    rawBody,
    secret,
    signature,
  );
}