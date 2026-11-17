"use client";
import { useState, type FormEvent } from "react";
import { createMetaEventId, getMetaBrowserIdentifiers, hasMarketingConsent, trackMetaEvent, trackVerifiedStarterBrowserPurchase } from "@/lib/meta-client";
import s from "@/app/ecommerce-starter/starter.module.css";

type FormValues = {
  fullName: string; mobile: string; email: string; businessName: string;
  businessType: string; facebookPage: string;
};
type Order = { orderId: string; accessToken: string };
const STARTER_TOTAL_DUE_BDT = 5000;
const waUrl = "https://wa.me/8801404385101?text=" + encodeURIComponent("Hi AgentSiraji, আমি ৳3,000 E-commerce Starter Package সম্পর্কে জানতে চাই।");
function fieldLabel(label: string, value: string, update: (v: string) => void, required = false, type = "text", placeholder = "") {
  return <label className={s.formField}><span>{label}</span><input type={type} required={required} value={value} onChange={e=>update(e.target.value)} placeholder={placeholder} maxLength={type==="tel"?16:160} /></label>;
}
export function StarterCheckout({ enabled }: { enabled: boolean }) {
  const [form,setForm] = useState<FormValues>({ fullName:"",mobile:"",email:"",businessName:"",businessType:"",facebookPage:"" });
  const [order,setOrder] = useState<Order | null>(null);
  const [status,setStatus] = useState<"details"|"payment"|"received">("details");
  const [paymentMethod,setPaymentMethod] = useState<"BKASH"|"CITY_BANK">("BKASH");
  const [reference,setReference] = useState("");
  const [proofUrl,setProofUrl] = useState("");
  const [paidConfirmed,setPaidConfirmed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [verifiedPaid,setVerifiedPaid] = useState(false);
  const [checkMessage,setCheckMessage] = useState("");
  const [error,setError] = useState("");
  const update = (key:keyof FormValues) => (value:string) => setForm(prev=>({...prev,[key]:value}));
  async function createOrder(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!enabled) {
      setOrder({orderId:"PREVIEW-NOT-SAVED",accessToken:""});
      setStatus("payment");
      return;
    }
    setBusy(true);
    const consent=hasMarketingConsent();
    const eventId=createMetaEventId("starter_checkout");
    const ids=getMetaBrowserIdentifiers();
    const params=new URLSearchParams(window.location.search);
    try {
      const response=await fetch("/api/ecommerce-starter/orders",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({...form, marketingConsent:consent,checkoutEventId:eventId,...ids,
          utmSource:params.get("utm_source"),utmMedium:params.get("utm_medium"),utmCampaign:params.get("utm_campaign")}),
      });
      const data=await response.json() as {orderId?:string;accessToken?:string;error?:string};
      if(!response.ok || !data.orderId || !data.accessToken) throw new Error(data.error||"Could not save your details.");
      setOrder({orderId:data.orderId,accessToken:data.accessToken});
      setStatus("payment");
      void trackMetaEvent("InitiateCheckout",{currency:"BDT",value:STARTER_TOTAL_DUE_BDT,content_name:"AgentSiraji E-commerce Starter"},eventId);
    } catch(ex) { setError(ex instanceof Error?ex.message:"Please try again."); }
    finally {setBusy(false);}
  }
  async function submitPayment(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!order || !paidConfirmed || !enabled)return;
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/ecommerce-starter/orders",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({...order,paymentMethod,transactionReference:reference,submittedAmount:STARTER_TOTAL_DUE_BDT,proofUrl}),
      });
      const data=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok || !data.ok)throw new Error(data.error||"Payment proof not saved.");
      setStatus("received");
    } catch(ex){setError(ex instanceof Error?ex.message:"Please try again.");}
    finally{setBusy(false);}
  }
  async function checkPaymentStatus() {
    if (!order) return;
    setBusy(true); setCheckMessage("");
    try {
      const response=await fetch("/api/ecommerce-starter/orders",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(order),cache:"no-store"});
      const data=await response.json() as {status?:string;verifiedEventId?:string;error?:string};
      if(!response.ok)throw new Error(data.error||"Could not retrieve status.");
      if(data.status==="PAID" && data.verifiedEventId) {
        setVerifiedPaid(true);
        const key="agentsiraji_starter_purchase_"+order.orderId;
        try {
          if(window.sessionStorage.getItem(key)!=="sent" && trackVerifiedStarterBrowserPurchase(data.verifiedEventId))
            window.sessionStorage.setItem(key,"sent");
        } catch {
          // Storage may be blocked. Tracking is optional, never affects payment status.
        }
        setCheckMessage("Payment verified. Welcome to AgentSiraji!");
      } else {
        setCheckMessage("Current payment status: "+(data.status||"Pending Verification")+".");
      }
    } catch(ex) {setCheckMessage(ex instanceof Error?ex.message:"Please try again.");}
    finally{setBusy(false);}
  }
  return <div className={s.checkoutCard}>
    {status==="details" && <>
      <div className={s.checkoutHead}><div><span>STEP 01 / 02</span><h3>আপনার Business-এর তথ্য</h3><p>Payment instructions দেখার আগে আপনার প্রয়োজনীয় তথ্য দিন।</p></div><strong>৳5,000</strong></div>
      {!enabled && <div className={s.notice} role="status"><strong>Preview checkout mode</strong><p>আপনি form fill করে Payment Details screen পর্যন্ত test করতে পারবেন। Real payment submission এখনো production launch-এর আগে বন্ধ রাখা হয়েছে।</p><a href={waUrl} target="_blank" rel="noopener noreferrer">WhatsApp inquiry ↗</a></div>}
      <form className={s.formGrid} onSubmit={createOrder}>
        {fieldLabel("Full Name *",form.fullName,update("fullName"),true,"text","আপনার পুরো নাম")}
        {fieldLabel("Mobile Number *",form.mobile,update("mobile"),true,"tel","01XXXXXXXXX")}
        {fieldLabel("Email (optional)",form.email,update("email"),false,"email","you@example.com")}
        {fieldLabel("Business / Page Name",form.businessName,update("businessName"),false,"text","আপনার business-এর নাম")}
        <label className={s.formField}><span>আপনি কী ধরনের business শুরু করবেন? *</span><textarea required maxLength={160} value={form.businessType} onChange={e=>update("businessType")(e.target.value)} placeholder="যেমন: Women's Clothing / Cosmetics / Grocery" rows={2}/></label>
        {fieldLabel("Facebook Page URL (optional)",form.facebookPage,update("facebookPage"),false,"url","https://facebook.com/...")}
        <div className={s.formFull}><p>Setup ৳3,000 + 1st month Hosting & Support ৳2,000 = ৳5,000 due now. Domain actual cost is separate and payable before registration. Extra Customization ৳2,000 when outside scope. <a href="/terms">Terms</a> ও <a href="/privacy">Privacy</a> পড়ুন।</p><button className={s.primary} type="submit" disabled={busy}>{busy?"Saving...":"CONTINUE TO PAYMENT — ৳5,000 →"}</button></div>
      </form>
    </>}
    {status==="payment" && <form onSubmit={submitPayment}>
      <div className={s.checkoutHead}><div><span>STEP 02 / 02</span><h3>Payment details submit করুন</h3><p>Order reference: {order?.orderId}</p></div><strong>৳5,000</strong></div>
      {!enabled && <div className={s.notice} role="status"><strong>Preview only — do not transfer yet</strong><p>Payment instructions screenটি test করার জন্য খোলা হয়েছে। Real payment proof submission production activation-এর আগে disabled থাকবে।</p></div>}
      <div className={s.methodRow}><label><input type="radio" checked={paymentMethod==="BKASH"} onChange={()=>setPaymentMethod("BKASH")}/> bKash</label><label><input type="radio" checked={paymentMethod==="CITY_BANK"} onChange={()=>setPaymentMethod("CITY_BANK")}/> City Bank</label></div>
      <div className={s.paymentInstruction}>
        {paymentMethod==="BKASH"?<>
          <h4>bKash Send Money · 01404385101</h4><p>bKash app থেকে <strong>Send Money</strong> নির্বাচন করে <strong>01404385101</strong> নম্বরে <strong>৳5,000</strong> পাঠান। Transfer complete হলে নিচে bKash <strong>Transaction ID (TrxID)</strong> লিখুন।</p>
        </>:<>
          <h4>The City Bank PLC</h4><p>Account: <strong>2183503557001</strong><br/>Name: Md. Minhaz Siraji<br/>Branch: Ashulia Branch</p>
        </>}
        <p><strong>Transfer amount now: ৳5,000</strong> — এতে ৳3,000 setup + first-month hosting/support ৳2,000 অন্তর্ভুক্ত। Domain-এর actual cost আলাদা, domain final করার পর payable। Transfer করার পর নিচে Transaction ID / bank reference লিখুন।</p>
      </div>
      <div className={s.formGrid}>
        {fieldLabel("Transaction ID / Bank Reference *",reference,setReference,true,"text","Transaction reference")}
        {fieldLabel("Optional HTTPS proof link",proofUrl,setProofUrl,false,"url","https://...")}
        <div className={s.formFull}><small>Screenshot থাকলে WhatsApp-এ পাঠাতে পারেন। Screenshot এখানে upload হচ্ছে না; proof link optional।</small></div>
        <label className={s.confirm}><input type="checkbox" checked={paidConfirmed} onChange={e=>setPaidConfirmed(e.target.checked)}/><span>আমি ৳5,000 transfer করেছি এবং reference যাচাই করে লিখেছি।</span></label>
        <div className={s.formFull}><button className={s.primary} type="submit" disabled={busy||!paidConfirmed||!enabled}>{busy?"Submitting...":enabled?"SUBMIT PAYMENT INFORMATION →":"PAYMENT SUBMISSION LOCKED IN PREVIEW"}</button></div>
      </div>
    </form>}
    {status==="received" && <div className={s.received} role="status"><span>✓</span><h3>{verifiedPaid?"Welcome to AgentSiraji":"Payment Information Received"}</h3><p>{verifiedPaid?"আপনার Payment verification সম্পন্ন হয়েছে। Onboarding-এর জন্য WhatsApp-এ যোগাযোগ করুন।":<>আমরা আপনার payment information পেয়েছি। এটি এখন <strong>Pending Verification</strong>। Bank/bKash receipt যাচাইয়ের পর আপনার onboarding শুরু হবে।</>}</p>{!verifiedPaid&&<p>Verification না হওয়া পর্যন্ত এই order-কে Paid বা Purchase হিসেবে গণনা করা হচ্ছে না।</p>}<button type="button" onClick={()=>void checkPaymentStatus()} disabled={busy} className={s.primary}>{busy?"Checking...":"CHECK PAYMENT STATUS"}</button>{checkMessage&&<p>{checkMessage}</p>}<p><a href={waUrl} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp ↗</a></p></div>}
    {error && <p className={s.error} role="alert">{error}</p>}
  </div>;
}
