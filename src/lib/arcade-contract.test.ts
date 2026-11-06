import test from "node:test";
import assert from "node:assert/strict";
import { arcadeUrl, readArcadeMessage, withArcadeBest } from "./arcade-contract.ts";

const source = {};
const expected = { source, origin: "https://kyrecai.github.io", game: "moneybags" as const, session: "0123456789abcdef" };
const data = { type: "kyrec.arcade", version: 1, game: "moneybags", session: expected.session, event: "result", result: { run: "one-round", score: 500, coins: 40, level: 1, cleared: true, familyPoints: 999999 } };
test("only the expected game frame, origin and session can report a score", () => {
  const valid = { source, origin: expected.origin, data };
  assert.equal(readArcadeMessage(valid, expected)?.result?.score,500);
  for(const bad of [{...valid,source:{}},{...valid,origin:"https://evil.test"},{...valid,data:{...data,session:"old-session"}},{...valid,data:{...data,game:"valentine"}},{...valid,data:{...data,version:2}},{...valid,data:{...data,event:"grant-points"}}]) assert.equal(readArcadeMessage(bad,expected),null);
  assert.ok(!JSON.stringify(readArcadeMessage(valid,expected)).includes("familyPoints"));
});
test("malformed results and unsupported origins fail closed", () => {
  for(const score of [-1,1.5,Infinity,NaN,"99",1e12]) assert.equal(readArcadeMessage({source,origin:expected.origin,data:{...data,result:{...data.result,score}}},expected),null);
  for(const level of [0,16,Infinity]) assert.equal(readArcadeMessage({source,origin:expected.origin,data:{...data,result:{...data.result,level}}},expected),null);
  assert.throws(()=>arcadeUrl("moneybags","null",expected.session));
  assert.throws(()=>arcadeUrl("moneybags","https://kyrec.au/path",expected.session));
  const url=new URL(arcadeUrl("valentine","https://kyrec.au",expected.session));
  assert.equal(url.pathname,"/valentine/");assert.equal(url.searchParams.get("origin"),"https://kyrec.au");
  assert.equal(url.searchParams.get("session"),expected.session);
});
test("best-score updates cannot alter financial or Family Points state", () => {
  const state={points:120,budgetSpent:40,arcadeBest:{moneybags:100}};
  const next={...state,arcadeBest:withArcadeBest(state.arcadeBest,"moneybags",200)};
  assert.equal(next.points,120);assert.equal(next.budgetSpent,40);assert.equal(next.arcadeBest.moneybags,200);
  assert.equal(withArcadeBest(next.arcadeBest,"moneybags",100),next.arcadeBest);
  assert.equal(withArcadeBest(next.arcadeBest,"moneybags",Infinity),next.arcadeBest);
});
