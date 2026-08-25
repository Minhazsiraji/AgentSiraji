type SSLCommerzSessionInput = {
  tranId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentId: string;
  plan: string;
  baseUrl: string;
};

type SSLCommerzSessionResponse = {
  status?: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
};

type SSLCommerzValidationResponse = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  currency_type?: string;
  bank_tran_id?: string;
  risk_level?: string;
  risk_title?: string;
  value_a?: string;
  value_b?: string;
};

function credentials() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new Error("SSLCOMMERZ sandbox credentials are not configured.");
  }

  if (process.env.SSLCOMMERZ_SANDBOX !== "true") {
    throw new Error("AgentSiraji checkout is currently restricted to SSLCOMMERZ sandbox.");
  }

  return { storeId, storePassword };
}

export async function createSSLCommerzSandboxSession(
  input: SSLCommerzSessionInput,
) {
  const { storeId, storePassword } = credentials();

  const form = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: input.amount.toFixed(2),
    currency: "BDT",
    tran_id: input.tranId,

    success_url: `${input.baseUrl}/api/payments/sslcommerz/success?tran_id=${encodeURIComponent(input.tranId)}`,
    fail_url: `${input.baseUrl}/api/payments/sslcommerz/fail?tran_id=${encodeURIComponent(input.tranId)}`,
    cancel_url: `${input.baseUrl}/api/payments/sslcommerz/cancel?tran_id=${encodeURIComponent(input.tranId)}`,
    ipn_url: `${input.baseUrl}/api/webhooks/sslcommerz`,

    cus_name: input.customerName,
    cus_email: input.customerEmail,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1200",
    cus_country: "Bangladesh",
    cus_phone: input.customerPhone,

    shipping_method: "NO",

    product_name: `AgentSiraji Commerce ${input.plan}`,
    product_category: "Software",
    product_profile: "non-physical-goods",

    value_a: input.paymentId,
    value_b: input.plan,
  });

  const response = await fetch(
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`SSLCOMMERZ session request failed with ${response.status}.`);
  }

  const data = (await response.json()) as SSLCommerzSessionResponse;

  if (
    data.status !== "SUCCESS" ||
    !data.GatewayPageURL ||
    !data.sessionkey
  ) {
    throw new Error(
      data.failedreason || "SSLCOMMERZ did not create a sandbox session.",
    );
  }

  return {
    gatewayUrl: data.GatewayPageURL,
    sessionKey: data.sessionkey,
  };
}

export async function validateSSLCommerzTransaction(valId: string) {
  const { storeId, storePassword } = credentials();

  const url = new URL(
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  );

  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePassword);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `SSLCOMMERZ validation request failed with ${response.status}.`,
    );
  }

  return (await response.json()) as SSLCommerzValidationResponse;
}

type SSLCommerzTransactionQueryElement = {
  val_id?: string;
  status?: string;
  tran_id?: string;
  amount?: string;
  currency_type?: string;
  currency_amount?: string;
  value_a?: string;
  value_b?: string;
  risk_level?: string;
  risk_title?: string;
};

type SSLCommerzTransactionQueryResponse = {
  APIConnect?: string;
  no_of_trans_found?: number;
  element?: SSLCommerzTransactionQueryElement[];
};

export async function querySSLCommerzTransaction(tranId: string) {
  const { storeId, storePassword } = credentials();

  const url = new URL(
    "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  );

  url.searchParams.set("tran_id", tranId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePassword);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `SSLCOMMERZ transaction query failed with ${response.status}.`,
    );
  }

  const data =
    (await response.json()) as SSLCommerzTransactionQueryResponse;

  if (
    data.APIConnect !== "DONE" ||
    !Array.isArray(data.element) ||
    data.element.length === 0
  ) {
    return null;
  }

  return data.element.find(
    (item) =>
      item.tran_id === tranId &&
      (item.status === "VALID" ||
        item.status === "VALIDATED"),
  ) ?? null;
}
