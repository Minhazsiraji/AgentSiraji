export const code = async function curateCandidates(inputs={}) {
 const bool=v=>v===true||v===1||/^(true|yes|1)$/i.test(String(v??"").trim());
 const cleaned=(v,n=350)=>String(v??"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,n);
 if(!bool(inputs.source_authorized))return {candidates:[],review_required:true,reason:"SOURCE_NOT_AUTHORIZED",outbound_enabled:false};
 const items=Array.isArray(inputs.items)?inputs.items:inputs.item?[inputs.item]:[];
 const now=Number.isFinite(Date.parse(inputs.now||""))?Date.parse(inputs.now):Date.now();
 const seen=new Set(),candidates=[];
 const limit=Math.max(1,Math.min(5,Number(inputs.max_candidates)||3));
 for(const item of items.slice(0,200)) {
  if(candidates.length>=limit)break;
  const title=cleaned(item.title,180);
  const details=cleaned(item.description||item.summary||item.content,400);
  const link=cleaned(item.link||item.url,450);
  if(!/^https?:\/\/[^/\s?#]+\.[^/\s?#]+(?:[/?#]|$)/i.test(link)||!title||details.length<20)continue;
  const published=Date.parse(item.pubDate||item.published||item.date||"");
  if(!Number.isFinite(published)||published>now+86400000||now-published>30*86400000)continue;
  const joined=(title+" "+details).toLowerCase();
  // Require an explicit external procurement signal. Generic marketing headlines are not leads.
  if(!/\b(rfp|rfq|request for proposals?|request for quotations?|invites? bids?|seeking (?:an? )?(?:vendor|agency|consultant)|looking for (?:an? )?(?:agency|vendor|consultant)|call for proposals?|tender for)\b/i.test(joined))continue;
  if(/\b(job opening|job vacancy|hiring an employee|internship|full.time employment)\b/i.test(joined))continue;
  let service="";
  if(/\b(website|web app|e.?commerce|web development|web design)\b/i.test(joined))service="website development";
  else if(/\b(social media|digital marketing|advertising campaign|seo)\b/i.test(joined))service="digital marketing";
  else if(/\b(automation|workflow|ai integration|chatbot)\b/i.test(joined))service="business automation";
  if(!service)continue;
  const key=link.split("#")[0].replace(/\/$/,"").toLowerCase();
  if(seen.has(key))continue;seen.add(key);
  candidates.push({
   business_name:"",
   country:cleaned(inputs.country,80),
   source_url:link,
   publisher:cleaned(inputs.source_label,120),
   opportunity_title:title,
   opportunity_excerpt:details,
   service_needed:service,
   published_at:new Date(published).toISOString(),
   status:"REVIEW_SOURCE_AND_BUYER",
   source_verified:"no",
   buyer_contact_verified:"no",
   draft_message:"",
   outbound_enabled:false,
   reviewer_note:"Research original posting and buyer identity; check duplicates, legitimacy, rights and do-not-contact status before copying into AgentSiraji Prospects."
  });
 }
 return {candidates,review_required:true,reason:"MANUAL_SOURCE_VALIDATION_REQUIRED",outbound_enabled:false};
};
