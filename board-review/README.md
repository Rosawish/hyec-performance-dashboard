# Board-only review route

Server adapter and synthetic tests only. This directory does not change the static dashboard, connect a production identity provider, store assessment data, or create a live route on GitHub Pages.

Integrate in a private application, outside the static build:
1. Verify session on the server. Do not accept viewer identity or role from a query, local storage, or an unverified client header.
2. Check the verified subject against the organization's approved Board roster and case-specific entitlement, including any recusal. Deny missing, revoked, or indeterminate access.
3. Load the current approved review payload from access-controlled server storage only after authorization. Never send evidence links into a public bundle or general search. If evidence or export is added later, each endpoint needs the same case ACL and a no-store response. Do not log assessment payloads.
4. Keep this report out of peer listings, search, comparisons, client-side data, and combined downloads. Do not add a link to the static public dashboard.
5. Before enabling live data, test the actual route and underlying data as an authorized Board viewer, an unauthorized signed-in user, a recused user, and an anonymous visitor. Check direct access, access revocation, cache, search, exports, and attachments.

Run the isolated tests: `node --test board-review/route.test.mjs`.
