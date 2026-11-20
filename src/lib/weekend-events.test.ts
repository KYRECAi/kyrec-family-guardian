import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicFamilyPage } from "./public-family-page.ts";
import { weekendEventsRequest } from "./weekend-events.server.ts";
import { perthWeekendStart, weekendInput } from "./weekend-events-contract.ts";

process.env.KYREC_CORE_URL="https://core.example.invalid";
process.env.KYREC_CORE_SERVICE_ID="guardian";
process.env.KYREC_CORE_SERVICE_KEY="synthetic-weekend-key-32-characters";
const event = () => ({id:"a".repeat(24),name:"Synthetic public fair",starts_at:"2026-11-21T12:00:00+08:00",ends_at:"2026-11-22T16:00:00+08:00",venue:"Test venue",locality:"Perth",source_url:"https://www.visitperth.com/events/test/",checked_at:new Date().toISOString(),price_min:0,price_max:0,currency:"AUD",price_status:"listed_free",price_note:"Check group eligibility and fees.",suitability:"parent_check_required",booking_performed:false});
const body = () => ({contract:"guardian-weekend-events-v1",weekend_start:"2026-11-21",weekend_end:"2026-11-22",timezone:"Australia/Perth",coverage:"Perth-wide",free_only:false,status:"available",source_checked_at:new Date().toISOString(),events:[event()],has_more:false,automatic_actions:false});
const reply=(value:unknown)=>(async()=>Response.json(value)) as typeof fetch;

test("Perth weekend calculation includes Saturday and Sunday without using browser timezone",()=>{
 assert.equal(perthWeekendStart(new Date("2026-11-20T17:00:00Z")),"2026-11-21");
 assert.equal(perthWeekendStart(new Date("2026-11-22T08:00:00Z")),"2026-11-21");
 assert.equal(perthWeekendStart(new Date("2026-11-23T08:00:00Z")),"2026-11-28");
});
test("public query rejects family, workspace and implicit free-only input",()=>{
 assert.equal(weekendInput.parse({start:"2026-11-21"}).free_only,false);
 for(const extra of [{workspace_id:"private"},{household:"private"},{free_only:"true"}])assert.throws(()=>weekendInput.parse({start:"2026-11-21",...extra}));
 assert.throws(()=>weekendInput.parse({start:"2026-11-22"}));
});
test("server requests public Core catalogue with no invented family actor",async()=>{
 let url="";let headers:HeadersInit|undefined;
 const transport=(async(input,init)=>{url=String(input);headers=init?.headers;assert.equal(init?.redirect,"error");assert.equal(init?.body,undefined);return Response.json(body());}) as typeof fetch;
 const result=await weekendEventsRequest({start:"2026-11-21"},transport);
 assert.equal(result.events.length,1);assert.match(url,/\/v1\/guardian\/events\/weekend\?/);
 assert.equal(new Headers(headers).get("X-Kyrec-User-Id"),"");
 assert.equal(result.automatic_actions,false);
});
test("malformed, stale, wrong-query and injected data fail without exposing source bodies",async()=>{
 for(const value of [{...body(),weekend_start:"2026-11-28"},{...body(),weekend_end:"2026-11-29"},
   {...body(),events:[{...event(),checked_at:new Date(Date.now()-40*3600000).toISOString()}]},
   {...body(),events:[{...event(),workspace_id:"another-family"}]},
   {...body(),events:[{...event(),source_url:"javascript:alert(1)"}]}]) {
   await assert.rejects(weekendEventsRequest({start:"2026-11-21"},reply(value)),/Weekend events are unavailable/);
 }
});
test("free-only requires source-backed zero prices; no-match is distinct from unavailable",async()=>{
 const free={...body(),free_only:true};
 assert.equal((await weekendEventsRequest({start:"2026-11-21",free_only:true},reply(free))).events.length,1);
 await assert.rejects(weekendEventsRequest({start:"2026-11-21",free_only:true},reply({...free,events:[{...event(),price_max:20}]})));
 const empty={...body(),status:"unavailable",events:[],source_checked_at:null};
 assert.equal((await weekendEventsRequest({start:"2026-11-21"},reply(empty))).status,"unavailable");
});

test("public weekend route never grants family-page access or prefix matching",()=>{
 assert.equal(isPublicFamilyPage("/weekend"),true);
 for(const path of ["/companions/scout","/family","/weekend/private","/account","/weekend-fake"])assert.equal(isPublicFamilyPage(path),false);
});
