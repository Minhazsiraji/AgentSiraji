// Public-data smoke test only. NO Activepieces writes or outbound messages.
import assert from "node:assert/strict";
import {code as request} from "./ted-request.mjs";
import {code as normalize} from "./ted-normalize.mjs";
const now=new Date().toISOString();
const cfg=await request({now,days:7});
const response=await fetch(cfg.url,{method:cfg.method,headers:cfg.headers,body:JSON.stringify(cfg.body)});
assert.equal(response.status,200,"TED public search must return 200");
const body=await response.json();
assert.ok(Array.isArray(body.notices),"TED notices array expected");
const out=await normalize({ted_response:{body},source_authorized:cfg.source_authorized,now,max_candidates:cfg.max_candidates});
assert.equal(out.outbound_enabled,false);
assert.ok(out.candidates.length<=3);
assert.ok(out.candidates.every(n=>n.source_verified==="no"&&!n.outbound_enabled&&!n.draft_message));
console.log(JSON.stringify({status:response.status,received:out.fetched_count,candidates:out.selected_count,
  samples:out.candidates.map(x=>({id:x.source_key,source_url:x.source_url,country:x.country,service:x.service_needed,title:x.opportunity_title}))},null,2));
