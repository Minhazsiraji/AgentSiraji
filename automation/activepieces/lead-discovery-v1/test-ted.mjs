import test from "node:test";
import assert from "node:assert/strict";
import {code as request} from "./ted-request.mjs";
import {code as normalize} from "./ted-normalize.mjs";
const now = "2026-10-19T10:00:00Z";
const notice = {
  "publication-number":"700001-2026", "publication-date":"2026-10-18+02:00",
  "notice-title":{eng:"Ireland – Advertising and marketing services – Digital marketing campaign for regional tourism"},
  "buyer-name":{eng:["Test County Council"]},
  "classification-cpv":["79340000"]
};
const wrap=(items, opt={})=>({ted_response:{body:{notices:items}},source_authorized:true,now,...opt});
test("TED request uses official API, bounded list and preferred countries",async()=>{
  const x=await request({now,days:7});assert.equal(x.url,"https://api.ted.europa.eu/v3/notices/search");
  assert.match(x.body.query,/IRL NLD FIN CYP LUX/);assert.match(x.body.query,/20261012 <> 20261019/);
  assert.equal(x.body.limit,75);assert.equal(x.max_candidates,3);
});
test("source unauthorized blocks every lead",async()=>{
  const x=await normalize({...wrap([notice]),source_authorized:false});
  assert.equal(x.blocked,"SOURCE_NOT_APPROVED");assert.deepEqual(x.candidates,[]);
});
test("official notice yields review-only lead, no contact",async()=>{
  const x=await normalize(wrap([notice]));assert.equal(x.candidates.length,1);
  assert.equal(x.candidates[0].source_key,"TED:700001-2026");
  assert.equal(x.candidates[0].source_verified,"no");
  assert.equal(x.candidates[0].outbound_enabled,false);
  assert.equal(x.candidates[0].draft_message,"");
});
test("malformed and unrelated dates rejected",async()=>{
  const x=await normalize(wrap([{...notice,"publication-date":"2026-01-01+02:00"}]));
  assert.equal(x.candidates.length,0);
});
test("CPV alone does not imply suitable client",async()=>{
  const x=await normalize(wrap([{...notice,"notice-title":{eng:"Ireland – IT services – Enterprise network maintenance contract"},"classification-cpv":["72000000"]}]));
  assert.equal(x.candidates.length,0);
});
test("nonpreferred country does not pass",async()=>{
  const x=await normalize(wrap([{...notice,"notice-title":{eng:"Belgium – Advertising – Digital marketing campaign"}}]));
  assert.equal(x.candidates.length,0);
});
test("no English title is never invented",async()=>{
  const x=await normalize(wrap([{...notice,"notice-title":{nld:"Marketing voor lokale ondernemingen"}}]));
  assert.equal(x.candidates.length,0);
});
test("untrusted arbitrary notice numbers rejected",async()=>{
  const x=await normalize(wrap([{...notice,"publication-number":"https://evil.example/"}]));
  assert.equal(x.candidates.length,0);
});
test("deduplicate notice IDs within the fetched page",async()=>{
  const x=await normalize(wrap([notice,notice]));assert.equal(x.candidates.length,1);
});
test("return safely on HTTP error response",async()=>{
  const x=await normalize({ted_response:{status:400,body:{error:"Bad request"}},source_authorized:true,now});
  assert.equal(x.blocked,"NO_VALID_TED_NOTICES");
});
test("three records maximum even with larger setting",async()=>{
  const x=await normalize(wrap(Array.from({length:8},(_,i)=>({...notice,"publication-number":String(700001+i)+"-2026"})),{max_candidates:100}));
  assert.equal(x.candidates.length,3);
});
test("excluded high-risk defense-related scope does not pass",async()=>{
  const x=await normalize(wrap([{...notice,"notice-title":{eng:"Ireland – Advertising – Digital marketing campaign for national security cyber-defence"}}]));
  assert.equal(x.candidates.length,0);
});
