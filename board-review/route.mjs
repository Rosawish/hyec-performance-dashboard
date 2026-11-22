// Server-side adapter. Supply the application's verified identity and case ACL.
// Do not load this file from a static page or point it at a public data store.
export const REVIEW_PATH = '/board/review';

const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};
const reportNotFound = () => new Response('Not found', { status: 404, headers });
const unavailable = () => new Response('Temporarily unavailable', { status: 503, headers });
const esc = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
const validText = (value, limit) => typeof value === 'string' &&
  value.trim().length > 0 && value.length <= limit;

const versions = ['A', 'B', 'C'];
function validReport(report) {
  return report && validText(report.title, 160) && validText(report.period, 80) &&
    Array.isArray(report.versions) && report.versions.length === 3 &&
    versions.every((id, i) => {
      const v = report.versions[i];
      return v?.id === id && typeof v.score === 'number' && Number.isFinite(v.score) &&
        v.score >= 1 && v.score <= 9 && validText(v.status, 80) &&
        validText(v.explanation, 4000);
    });
}

function render(report) {
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(report.title)}</title>
<style>body{color:#eef5ff;background:#0e1727;font:1rem/1.6 system-ui,sans-serif;margin:0}main{max-width:68rem;margin:auto;padding:2rem 1rem}article{background:#16243a;padding:1rem 1.25rem;border-radius:.7rem;min-width:0;overflow-wrap:anywhere}h2{margin:0;color:#9ee8ff}div{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}strong{display:block;font-size:1.8rem}</style>
<main><h1>${esc(report.title)}</h1><p>${esc(report.period)}｜董事會評議參考，非正式核定。</p><div>
${report.versions.map(v => `<article><h2>${v.id} 版</h2><strong>${v.score.toFixed(2)}／9</strong><p>${esc(v.status)}</p><p>${esc(v.explanation)}</p></article>`).join('')}
</div></main></html>`;
}

export function createBoardReviewHandler({ verifySession, checkBoardAccess, loadReport }) {
  for (const fn of [verifySession, checkBoardAccess, loadReport]) {
    if (typeof fn !== 'function') throw new TypeError('Verified session, case access and private storage adapters are required');
  }
  return async function handle(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== REVIEW_PATH || url.search || url.hash) {
      return reportNotFound();
    }
    let viewer;
    try {
      viewer = await verifySession(request);
      if (!validText(viewer?.subject, 240) ||
          await checkBoardAccess(viewer.subject) !== true) return reportNotFound();
    } catch {
      return reportNotFound();
    }
    try {
      const report = await loadReport();
      if (!validReport(report)) return unavailable();
      return new Response(render(report), { headers });
    } catch {
      return unavailable();
    }
  };
}
