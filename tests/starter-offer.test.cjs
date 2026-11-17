const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-ts.cjs");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

test("starter package price, site and protected live gate are explicit", () => {
  const starter = load()("lib/starter-offer.ts");
  assert.equal(starter.STARTER_SETUP_FEE_BDT, 3000);
  assert.equal(starter.STARTER_HOSTING_MONTHLY_BDT, 2000);
  assert.equal(starter.STARTER_PRICE_BDT, 5000);
  assert.equal(starter.STARTER_BKASH, "01404385101");
  assert.equal(starter.isBangladeshMobile("01700000000"), true);
  assert.equal(starter.isBangladeshMobile("not-a-number"), false);
  assert.equal(starter.safeStarterUrl("javascript:alert(1)"), false);
  assert.equal(starter.safeStarterUrl("https://facebook.com/store"), true);
  const old = process.env.STARTER_LIVE_PAYMENTS_ENABLED;
  delete process.env.STARTER_LIVE_PAYMENTS_ENABLED;
  assert.equal(starter.starterLiveEnabled(), false);
  process.env.STARTER_LIVE_PAYMENTS_ENABLED = old ?? "";
});

test("public starter endpoint does not accept payments while gated", async () => {
  const original = process.env.STARTER_LIVE_PAYMENTS_ENABLED;
  delete process.env.STARTER_LIVE_PAYMENTS_ENABLED;
  try {
    const api = load()("app/api/ecommerce-starter/orders/route.ts");
    const makeRequest = (method) => new Request("https://agentsiraji.com/api/ecommerce-starter/orders", {
      method, headers: { "content-type":"application/json" },
      body: JSON.stringify({transactionReference:"FAKE12345"}),
    });
    assert.equal((await api.PATCH(makeRequest("PATCH"))).status, 503);
    assert.equal((await api.POST(makeRequest("POST"))).status, 503);
    assert.equal((await api.PUT(makeRequest("PUT"))).status, 503);
  } finally {
    if (original === undefined) delete process.env.STARTER_LIVE_PAYMENTS_ENABLED;
    else process.env.STARTER_LIVE_PAYMENTS_ENABLED = original;
  }
});

test("existing public Meta relay still cannot send fabricated Purchase", async () => {
  const { POST } = load()("app/api/meta/events/route.ts");
  const req = new Request("https://agentsiraji.com/api/meta/events", {
    method:"POST", headers:{"content-type":"application/json"},
    body:JSON.stringify({eventName:"Purchase",eventId:"fake_purchase_1234",consentGranted:true}),
  });
  assert.equal((await POST(req)).status,400);
});

test("verified-only CAPI Purchase uses correct value and stable event ID", async () => {
  const originalFetch = global.fetch;
  const env = {...process.env};
  process.env.VERCEL_ENV="production";
  process.env.META_PIXEL_ID="123456";
  process.env.NEXT_PUBLIC_META_PIXEL_ID="123456";
  process.env.META_CAPI_ACCESS_TOKEN="test_token";
  let body;
  global.fetch=async(_url,options)=>{body=JSON.parse(options.body);return Response.json({events_received:1});};
  try {
    const meta = load()("lib/meta.ts");
    assert.equal((await meta.sendMetaEvent({eventName:"Purchase",eventId:"as_starter_purchase_00000000-0000-4000-8000-000000000001"})).sent,false);
    const result=await meta.sendVerifiedStarterPurchaseEvent({
      eventId:"as_starter_purchase_00000000-0000-4000-8000-000000000001",
      eventSourceUrl:"https://agentsiraji.com/ecommerce-starter",
      customData:{value:5000,currency:"BDT"}
    });
    assert.equal(result.sent,true);
    assert.equal(body.data[0].event_name,"Purchase");
    assert.equal(body.data[0].event_id,"as_starter_purchase_00000000-0000-4000-8000-000000000001");
    assert.equal(body.data[0].custom_data.value,5000);
  } finally {global.fetch=originalFetch;process.env=env;}
});

test("starter Purchase browser event matches server event id and requires marketing consent", async () => {
  let consent="granted";
  const calls=[];
  global.window={localStorage:{getItem:()=>consent},fbq:(...x)=>calls.push(x)};
  try{
    const meta=load()("lib/meta-client.ts");
    const id="as_starter_purchase_00000000-0000-4000-8000-000000000001";
    meta.markPixelReady();
    assert.equal(meta.trackVerifiedStarterBrowserPurchase(id),true);
    assert.equal(calls.at(-1)[1],"Purchase");
    assert.equal(calls.at(-1)[3].eventID,id);
    consent="denied";
    assert.equal(meta.trackVerifiedStarterBrowserPurchase(id),false);
  } finally {delete global.window;}
});

test("migration protects payment state and duplicate payment references", () => {
  const migration=fs.readFileSync(path.join(root,"database/0009_starter_launch_price_5000.sql"),"utf8");
  assert.match(migration,/PENDING_VERIFICATION/);
  assert.ok(migration.includes("SET DEFAULT 5000"));
  assert.ok(migration.includes("CREATE UNIQUE INDEX IF NOT EXISTS starter_payment_reference_unique"));
  const code=fs.readFileSync(path.join(root,"lib/starter-offer.ts"),"utf8");
  assert.ok(code.includes("status = 'PENDING_VERIFICATION'"));
  assert.ok(code.includes("status = 'PAID'"));
  assert.ok(code.includes("purchase_event_processed_at IS NULL"));
  assert.ok(code.includes("sha256(input.accessToken)"));
});
