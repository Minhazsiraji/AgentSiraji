"use client";
import { useCallback, useEffect, useState } from "react";

type StarterOrder = {
  id:string;fullName:string;mobile:string;email:string|null;businessName:string|null;
  businessType:string;facebookPage:string|null;status:string;amountBdt:number;
  paymentMethod:string|null;transactionReference:string|null;submittedAmount:number|null;
  proofUrl:string|null;submittedAt:string|null;verifiedAt:string|null;note:string|null;
  purchaseEventResult:string;utmSource:string|null;utmMedium:string|null;utmCampaign:string|null;
  createdAt:string;
};
export function StarterOrdersAdmin(){
  const [orders,setOrders]=useState<StarterOrder[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const [selected,setSelected]=useState("");
  const [decision,setDecision]=useState<"APPROVE"|"REJECT">("APPROVE");
  const [note,setNote]=useState("");
  const [verified,setVerified]=useState(false);
  const [result,setResult]=useState("");
  const load=useCallback(async()=>{
    try{
      const r=await fetch("/api/admin/starter-orders",{cache:"no-store"});
      const data=await r.json() as {orders?:StarterOrder[];error?:string};
      if(!r.ok)throw new Error(data.error||"Not authorized");
      setOrders(data.orders||[]);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Could not load orders.");}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function act(orderId:string,action:"APPROVE"|"REJECT"|"RETRY_PURCHASE"){
    setBusy(orderId);setResult("");
    try {
      const r=await fetch("/api/admin/starter-orders",{method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({orderId,decision:action,note,confirmedBankReceipt:verified})});
      const data=await r.json() as {error?:string;tracking?:string;status?:string};
      if(!r.ok)throw new Error(data.error||"Review failed");
      setResult("Updated: "+(data.status||"PAID")+" | Meta: "+(data.tracking||"not_sent"));
      setSelected("");setNote("");setVerified(false);await load();
    }catch(e){setResult(e instanceof Error?e.message:"Review failed.");}
    finally{setBusy("");}
  }
  const pending=orders.filter(o=>o.status==="PENDING_VERIFICATION");
  const paid=orders.filter(o=>o.status==="PAID");
  return <div style={{display:"grid",gap:18,marginTop:24}}>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <strong>New/pending: {orders.filter(o=>o.status==="PENDING_PAYMENT").length}</strong>
      <strong>Awaiting verification: {pending.length}</strong>
      <strong>Paid: {paid.length}</strong>
      <strong>Verified setup revenue: ৳{paid.length*3000}</strong>
      <button type="button" onClick={()=>void load()}>Refresh</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {result && <p role="status">{result}</p>}
    <div style={{display:"grid",gap:14}}>
      {orders.map(o=><article key={o.id} style={{border:"1px solid #d7e4f2",borderRadius:14,padding:20,background:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div><strong>{o.fullName}</strong> · <a href={"tel:"+o.mobile}>{o.mobile}</a> <br/>
          <small>{o.email||"No email"} · {o.businessName||"Business name pending"}</small><br/>
          <small>{o.businessType}</small></div>
          <div><strong>{o.status}</strong><br/><small>৳{o.amountBdt} · {o.paymentMethod||"No transfer"}</small><br/><small>Meta: {o.purchaseEventResult}</small></div>
        </div>
        <p style={{fontSize:13,overflowWrap:"anywhere"}}>Order: {o.id} · Payment reference: <strong>{o.transactionReference||"Not submitted"}</strong> · Claimed amount: ৳{o.submittedAmount??0}</p>
        <p style={{fontSize:12}}>UTM: {o.utmSource||"direct"}/{o.utmMedium||"-"}/{o.utmCampaign||"-"}</p>
        {o.proofUrl&& <p><a href={o.proofUrl} target="_blank" rel="noopener noreferrer">View submitted proof link</a></p>}
        {o.status==="PENDING_VERIFICATION" && <div>
          <button type="button" onClick={()=>{setSelected(selected===o.id?"":o.id);setVerified(false);setNote("");}}>Review payment</button>
          {selected===o.id&&<div style={{display:"grid",maxWidth:650,gap:12,marginTop:18}}>
            <label>Decision <select value={decision} onChange={e=>setDecision(e.target.value as "APPROVE"|"REJECT")}><option value="APPROVE">Approve - paid</option><option value="REJECT">Reject</option></select></label>
            <label>Verification note <textarea required minLength={8} maxLength={1000} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Mention the independent bank/bKash ledger check or why rejecting."/></label>
            {decision==="APPROVE"&&<label><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> I checked this transfer against independent bank/bKash receiving records.</label>}
            <button type="button" disabled={busy===o.id || note.trim().length<8 || (decision==="APPROVE"&&!verified)} onClick={()=>void act(o.id,decision)}>{busy===o.id?"Saving...":"Confirm decision"}</button>
          </div>}
        </div>}
        {o.status==="PAID"&&<div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          {o.purchaseEventResult==="FAILED"&&<button type="button" disabled={busy===o.id} onClick={()=>void act(o.id,"RETRY_PURCHASE")}>Retry Meta Purchase signal</button>}
          <a target="_blank" rel="noopener noreferrer" href={"https://wa.me/88"+o.mobile+"?text="+encodeURIComponent("AgentSiraji-এ স্বাগতম! আপনার ৳3,000 Starter Setup payment যাচাই হয়েছে। এখন business logo, product list, courier preference ও domain requirement পাঠান।")}>Send onboarding WhatsApp ↗</a>
        </div>}
      </article>)}
      {!orders.length&&!error&&<p>No starter orders yet.</p>}
    </div>
  </div>;
}
