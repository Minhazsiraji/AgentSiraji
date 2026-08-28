type PaddleTransactionResponse = {
  data?: {
    id?: string;
    status?: string;
    checkout?: { url?: string | null } | null;
  };
};

function getApiKey() {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not configured.");
  if (process.env.PADDLE_ENV !== "sandbox") {
    throw new Error("AgentSiraji Paddle integration is restricted to sandbox.");
  }
  return apiKey;
}

function envKey(product: string, plan: string, suffix: string) {
  const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return `PADDLE_${normalize(product)}_${normalize(plan)}_${suffix}`;
}

export async function createProductPaddleSandboxTransaction(input: {
  paymentId: string;
  product: string;
  plan: string;
  setupAmount: number;
  recurringAmount: number;
  checkoutUrl: string;
}) {
  const apiKey = getApiKey();
  const recurringKey = envKey(input.product, input.plan, "RECURRING_PRICE_ID");
  const setupKey = envKey(input.product, input.plan, "SETUP_PRICE_ID");
  const recurringPriceId = process.env[recurringKey];
  const setupPriceId = process.env[setupKey];

  if (!recurringPriceId) {
    throw new Error(`${recurringKey} is not configured.`);
  }

  const items = [] as Array<{ price_id: string; quantity: number }>;
  if (input.setupAmount > 0) {
    if (!setupPriceId) throw new Error(`${setupKey} is not configured.`);
    items.push({ price_id: setupPriceId, quantity: 1 });
  }
  items.push({ price_id: recurringPriceId, quantity: 1 });

  const response = await fetch("https://sandbox-api.paddle.com/transactions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      items,
      collection_mode: "automatic",
      enable_checkout: true,
      custom_data: {
        agentsiraji_payment_id: input.paymentId,
        agentsiraji_product: input.product,
        agentsiraji_plan: input.plan,
        agentsiraji_setup_amount: input.setupAmount,
        agentsiraji_recurring_amount: input.recurringAmount,
      },
      checkout: { url: input.checkoutUrl },
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as PaddleTransactionResponse | {
    error?: { code?: string; detail?: string; request_id?: string };
  };

  if (!response.ok) {
    if ("error" in payload && payload.error) {
      const requestId = payload.error.request_id ? ` Request ID: ${payload.error.request_id}` : "";
      throw new Error(`${payload.error.code ?? "Paddle error"}: ${payload.error.detail ?? "Paddle transaction creation failed."}${requestId}`);
    }
    throw new Error(`Paddle transaction creation failed with ${response.status}.`);
  }

  const data = (payload as PaddleTransactionResponse).data;
  if (!data?.id || !data.checkout?.url) {
    throw new Error("Paddle did not return a usable sandbox checkout transaction.");
  }

  return { transactionId: data.id, checkoutUrl: data.checkout.url };
}
