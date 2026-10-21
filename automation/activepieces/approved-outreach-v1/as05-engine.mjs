/**
 * AgentSiraji AS-05 human-approved outreach policy engine.
 * NO network calls, messages or credential access; export 'code' for Activepieces Code step.
 */
const ALLOWED_HOSTS={LINKEDIN:['linkedin.com'],FACEBOOK:['facebook.com','fb.com','m.me'],INSTAGRAM:['instagram.com'],WHATSAPP:['wa.me','api.whatsapp.com'],FREELANCER:['freelancer.com'],FREELANCER_NL:['freelancer.nl']};
const positive=x=>x===true;
const value=x=>typeof x==='string'?x.trim():'';
const parsed=x=>{const d=new Date(x);return Number.isFinite(d.valueOf())?d:null;};
const fields=(rec,names)=>names.every(k=>value(rec[k]).length>0);
const failure=(reason,other={})=>({ok:false,reason,outbound_enabled:false,...other});
function channelURL(channel,raw){
 if(!ALLOWED_HOSTS[channel]||!value(raw))return false;
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
 return ALLOWED_HOSTS[channel].some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}
 catch{return false;}
}
export function qualify(inputs={}){
 const lead=inputs.lead??{};
 if(!fields(lead,['lead_id','source_url','recipient_url','channel','business_name','buyer_need']))return failure('LEAD_FIELDS_MISSING');
 if(!channelURL(lead.channel,lead.recipient_url))return failure('CHANNEL_OR_RECIPIENT_UNVERIFIED');
 try{const u=new URL(lead.source_url);if(u.protocol!=='https:')return failure('SOURCE_URL_NOT_HTTPS');}
 catch{return failure('SOURCE_URL_INVALID');}
 if(positive(lead.do_not_contact)||positive(lead.previously_contacted))return failure('DO_NOT_CONTACT_OR_ALREADY_CONTACTED');
 if(!positive(lead.source_verified)||!positive(lead.open_request_verified)||!positive(lead.buyer_requested_service)||!positive(lead.service_fit_verified))
 return failure('NEED_OR_SOURCE_NOT_VERIFIED',{queue_status:'RESEARCH_ONLY'});
 if(!positive(lead.channel_permitted)||!positive(lead.recipient_verified))return failure('CONTACT_PERMISSION_UNVERIFIED');
 const now=parsed(inputs.now??new Date().toISOString()),checked=parsed(lead.last_verified_at);
 if(!now||!checked||checked>now||now-checked>3*86400000)return failure('VERIFICATION_STALE_OR_INVALID');
 return {ok:true,queue_status:'READY_FOR_OWNER_REVIEW',lead_id:lead.lead_id,outbound_enabled:false};
}
export function approvalHandoff(inputs={}){
 const lead=inputs.lead??{},approval=inputs.approval??{},q=qualify(inputs);
 if(!q.ok)return failure('QUALIFICATION_FAILED:'+q.reason);
 if(!positive(inputs.exact_submission_lookup_completed)||!Array.isArray(inputs.prior_submissions))return failure('PERSISTENT_SEND_LOOKUP_UNVERIFIED');
 if(inputs.prior_submissions.length>0)return failure('ALREADY_SUBMITTED_OR_UNRESOLVED_ATTEMPT');
 // Approval must come from a separate authenticated owner-approval lookup, never from the prospect or AI intake payload.
 const trusted=inputs.trusted_approval_record??{};
 if(inputs.trusted_approval_lookup_completed!==true||
    !value(trusted.approval_id)||trusted.approval_id!==approval.approval_id||
    trusted.lead_id!==lead.lead_id||trusted.decision!=='APPROVE_EXACT_MESSAGE'||
    trusted.approved_by!=='OWNER'||trusted.channel!==lead.channel||
    trusted.recipient_url!==lead.recipient_url||
    trusted.approved_text!==inputs.current_message||
    trusted.approved_at!==approval.approved_at||trusted.expires_at!==approval.expires_at)
 return failure('AUTHENTICATED_OWNER_APPROVAL_LOOKUP_REQUIRED');
 if(approval.decision!=='APPROVE_EXACT_MESSAGE'||approval.approved_by!=='OWNER')return failure('OWNER_APPROVAL_REQUIRED');
 if(!fields(approval,['approval_id','lead_id','channel','recipient_url','approved_text','approved_at','expires_at']))return failure('APPROVAL_FIELDS_MISSING');
 if(approval.lead_id!==lead.lead_id||approval.channel!==lead.channel||approval.recipient_url!==lead.recipient_url||approval.approved_text!==inputs.current_message)
 return failure('APPROVED_MESSAGE_OR_RECIPIENT_MISMATCH');
 const now=parsed(inputs.now??new Date().toISOString()),from=parsed(approval.approved_at),through=parsed(approval.expires_at);
 if(!now||!from||!through||from>now||through<=now||through-from>48*3600000)return failure('APPROVAL_EXPIRED_OR_INVALID');
 const msg=value(inputs.current_message);
 if(msg.length<20||msg.length>2500||/\{\{[^}]+\}\}|\[insert |\[your name\]/i.test(msg))return failure('MESSAGE_CONTENT_INVALID');
 return {ok:true,ready_for_supervised_handoff:true,requires_platform_session:true,
 requires_owner_final_review:true,outbound_enabled:false,
 packet:{lead_id:lead.lead_id,channel:lead.channel,recipient_url:lead.recipient_url,
 approval_id:approval.approval_id,message_text:msg,status:'AWAITING_PLATFORM_SUBMISSION'}};
}
const TERMINAL=new Set(['WON','LOST','DO_NOT_CONTACT']);
const EVENT_ALLOWED={
 APPROVED:['READY_FOR_OWNER_REVIEW'],
 SENT_CONFIRMED:['APPROVED','AWAITING_PLATFORM_SUBMISSION'],
 REPLIED:['SENT_CONFIRMED','FOLLOWUP_SENT_CONFIRMED'],
 FOLLOWUP_SENT_CONFIRMED:['SENT_CONFIRMED'],
 DISCOVERY_CALL:['REPLIED'],
 PROPOSAL_SENT:['REPLIED','DISCOVERY_CALL'],
 WON:['PROPOSAL_SENT','DISCOVERY_CALL'],
 LOST:['SENT_CONFIRMED','REPLIED','DISCOVERY_CALL','PROPOSAL_SENT','FOLLOWUP_SENT_CONFIRMED'],
 DO_NOT_CONTACT:['READY_FOR_OWNER_REVIEW','APPROVED','AWAITING_PLATFORM_SUBMISSION','SENT_CONFIRMED','REPLIED','DISCOVERY_CALL','PROPOSAL_SENT','FOLLOWUP_SENT_CONFIRMED']
};
export function recordOutcome(inputs={}){
 const record=inputs.record??{},event=inputs.event??{};
 if(!fields(record,['lead_id','status'])||!fields(event,['event_id','lead_id','type','actor','occurred_at']))return failure('MISSING_RECORD_OR_EVENT');
 if(event.lead_id!==record.lead_id)return failure('EVENT_LEAD_MISMATCH');
 if(TERMINAL.has(record.status))return failure('TERMINAL_RECORD');
 if(!EVENT_ALLOWED[event.type]?.includes(record.status))return failure('INVALID_STATE_TRANSITION');
 if(!parsed(event.occurred_at))return failure('INVALID_EVENT_TIME');
 if(!positive(inputs.exact_event_lookup_completed)||!Array.isArray(inputs.previous_events))return failure('PERSISTENT_EVENT_LOOKUP_UNVERIFIED');
 if(inputs.previous_events.length)return failure('EVENT_ALREADY_RECORDED');
 if(event.type==='APPROVED'&&(event.approved_by!=='OWNER'||!fields(event,['approval_id','approved_message_text','approved_recipient_url'])))
 return failure('EXPLICIT_OWNER_APPROVAL_EVIDENCE_REQUIRED');
 if(event.type==='SENT_CONFIRMED'||event.type==='FOLLOWUP_SENT_CONFIRMED'){
 if(!positive(event.platform_delivery_observed)||!fields(event,['approval_id','platform_receipt']))return failure('DELIVERY_CONFIRMATION_REQUIRED');
 }
 if(event.type==='REPLIED'&&!positive(event.actual_reply_observed))return failure('REPLY_EVIDENCE_REQUIRED');
 const next={...record,status:event.type,last_event_id:event.event_id,last_event_at:event.occurred_at};
 if(event.type==='SENT_CONFIRMED'||event.type==='FOLLOWUP_SENT_CONFIRMED'){
 next.sent_at=event.occurred_at;next.platform_receipt=event.platform_receipt;
 next.follow_up_due_at=value(event.approved_follow_up_due_at)&&parsed(event.approved_follow_up_due_at)>parsed(event.occurred_at)?event.approved_follow_up_due_at:'';
 }
 if(event.type==='REPLIED'){next.reply_at=event.occurred_at;next.follow_up_due_at='';}
 if(event.type==='DO_NOT_CONTACT'||event.type==='LOST'||event.type==='WON')next.follow_up_due_at='';
 return {ok:true,next_record:next,event_to_append:{...event},outbound_enabled:false};
}
export function followupsDue(inputs={}){
 const now=parsed(inputs.now??new Date().toISOString());
 if(!now||!Array.isArray(inputs.records))return failure('INVALID_FOLLOWUP_SCAN');
 const due=inputs.records.filter(x=>!positive(x.do_not_contact)&&['SENT_CONFIRMED','FOLLOWUP_SENT_CONFIRMED'].includes(x.status)&&
 !value(x.reply_at)&&parsed(x.follow_up_due_at)&&parsed(x.follow_up_due_at)<=now)
 .map(x=>({lead_id:x.lead_id,channel:x.channel,recipient_url:x.recipient_url,
 due_at:x.follow_up_due_at,action:'OWNER_REVIEW_FOLLOWUP_ONLY'}));
 return {ok:true,due,outbound_enabled:false,auto_send:false};
}
export const code=async(inputs={})=>{
 switch(inputs.action){
 case 'qualify':return qualify(inputs);
 case 'handoff':return approvalHandoff(inputs);
 case 'record_outcome':return recordOutcome(inputs);
 case 'due_followups':return followupsDue(inputs);
 default:return failure('UNKNOWN_ACTION');
 }
};