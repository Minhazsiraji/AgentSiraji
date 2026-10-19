import test from "node:test";
import assert from "node:assert/strict";
import {code} from "./dedupe-gate.mjs";
const c={source_key:"TED:700001-2026",source_url:"https://ted.europa.eu/en/notice/-/detail/700001-2026",
  status:"REVIEW_SOURCE_AND_BUYER",source_verified:"no",outbound_enabled:false,
  opportunity_title:"Ireland – Advertising – Digital marketing campaign",opportunity_excerpt:"Read source",
  publisher:"EU TED",service_needed:"digital marketing",published_at:"2026-10-18T00:00:00.000Z"};
test("first new queue item returns create payload, not outreach",async()=>{
 const r=await code({candidate:c,find_result:[],exact_lookup_performed:true});
 assert.equal(r.should_create,true);assert.equal(r.outbound_enabled,false);
 assert.equal(Object.keys(r.create_fields).length,7);
});
test("repeat with matched record is skipped",async()=>{
 const r=await code({candidate:c,find_result:[{id:"row-1"}],exact_lookup_performed:true});
 assert.equal(r.should_create,false);assert.equal(r.reason,"ALREADY_IN_QUEUE");
});
test("unverified Find Records output fails closed",async()=>{
 const r=await code({candidate:c,find_result:{unknown:[]},exact_lookup_performed:true});
 assert.equal(r.should_create,false);
});
test("missing exact filter evidence stops insertion",async()=>{
 const r=await code({candidate:c,find_result:[],exact_lookup_performed:false});
 assert.equal(r.should_create,false);
});
test("forged candidate source rejected",async()=>{
 const r=await code({candidate:{...c,source_url:"https://malicious.example/"},find_result:[],exact_lookup_performed:true});
 assert.equal(r.should_create,false);
});
test("contact-enabled candidate refused",async()=>{
 const r=await code({candidate:{...c,outbound_enabled:true},find_result:[],exact_lookup_performed:true});
 assert.equal(r.should_create,false);
});
test("altered source key refused",async()=>{
 const r=await code({candidate:{...c,source_key:"TED:other"},find_result:[],exact_lookup_performed:true});
 assert.equal(r.should_create,false);
});
