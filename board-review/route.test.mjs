import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoardReviewHandler, REVIEW_PATH } from './route.mjs';

const sample = {
  title: 'Fictional <review>',
  period: 'Example quarter',
  versions: ['A','B','C'].map((id,i)=> ({
    id, score: 6 + i / 4, status: 'Synthetic only', explanation: 'Example & evidence',
  })),
};
function fixture(identity, access, report = sample) {
  let calls = 0;
  const handler = createBoardReviewHandler({
    verifySession: async () => identity,
    checkBoardAccess: async subject => typeof access === 'function' ? access(subject) : access,
    loadReport: async () => { calls++; return report; },
  });
  return { handler, reads: () => calls };
}
function request(path=REVIEW_PATH, init) { return new Request('https://example.test'+path,init); }

test('Anonymous, non-Board and recused viewers cannot load data', async () => {
  for (const [identity, access] of [[null,false],[{subject:'manager'},false],[{subject:'recused'},false],[{subject:'viewer'},'true']]) {
    const f=fixture(identity,access);
    const response=await f.handler(request());
    assert.equal(response.status,404);
    assert.equal(f.reads(),0);
    assert.doesNotMatch(await response.text(),/review|Synthetic/i);
  }
});
test('Entitlement errors do not load data', async () => {
  const f=fixture({subject:'director'},()=>{ throw Error('ACL offline'); });
  assert.equal((await f.handler(request())).status,404);
  assert.equal(f.reads(),0);
});
test('Approved Board viewer receives escaped, non-cacheable report', async () => {
  const f=fixture({subject:'director'},subject=>subject==='director');
  const response=await f.handler(request());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.match(await response.text(),/Fictional &lt;review&gt;[\s\S]*6\.50／9/);
  assert.equal(f.reads(),1);
});
test('Unsupported methods, alternate paths and query modes never load data', async () => {
  const f=fixture({subject:'director'},true);
  for (const req of [request('/board/review/export'), request('/board/review?export=1'), request(REVIEW_PATH,{method:'POST'})]) {
    assert.equal((await f.handler(req)).status,404);
  }
  assert.equal(f.reads(),0);
});
test('Unexpected payload fails without returning report data', async () => {
  const f=fixture({subject:'director'},true,{...sample,versions:[]});
  const response=await f.handler(request());
  assert.equal(response.status,503);
  assert.doesNotMatch(await response.text(),/Fictional/);
});
