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

function getApiKey() {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not configured.");
  }

  if (process.env.PADDLE_ENV !== "sandbox") {
    throw new Error("AgentSiraji Paddle integration is restricted to sandbox.");
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
            quantity: 1,
            price: {
              description: `AgentSiraji Commerce ${input.plan} setup`,
              name: `${input.plan} setup`,
              unit_price: {
                amount: String(input.setupAmount),
                currency_code: "USD",
              },
              product: {
                name: `AgentSiraji Commerce ${input.plan}`,
                tax_category: "standard",
                description:
                  "Managed e-commerce platform setup and onboarding",
              },
            },
          },
          {
            quantity: 1,
            price: {
              description: `AgentSiraji Commerce ${input.plan} monthly`,
              name: `${input.plan} monthly`,
              billing_cycle: {
                interval: "month",
                frequency: 1,
              },
              unit_price: {
                amount: String(input.recurringAmount),
                currency_code: "USD",
              },
              product: {
                name: `AgentSiraji Commerce ${input.plan}`,
                tax_category: "standard",
                description:
                  "Managed e-commerce platform monthly subscription",
              },
            },
          },
        ],
        collection_mode: "automatic",
        enable_checkout: true,
        custom_data: {
          agentsiraji_payment_id: input.paymentId,
          agentsiraji_plan: input.plan,
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
    | { error?: { detail?: string } };

  if (!response.ok) {
    const detail =
      "error" in payload
        ? payload.error?.detail
        : undefined;

    throw new Error(
      detail ||
        `Paddle transaction creation failed with ${response.status}.`,
    );
  }

  const data = (payload as PaddleTransactionResponse).data;

  if (!data?.id || !data.checkout?.url) {
    throw new Error(
      "Paddle did not return a sandbox transaction checkout URL.",
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
    throw new Error("PADDLE_WEBHOOK_SECRET is not configured.");
  }

  const paddle = getPaddleClient();

  return paddle.webhooks.unmarshal(
    rawBody,
    secret,
    signature,
  );
}