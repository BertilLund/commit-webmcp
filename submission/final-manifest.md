# Final submission manifest

Status: **pre-submission — final links pending upload and Devpost draft**

- Project: Commit
- Tagline: Git for agent actions on the web.
- Repository: https://github.com/BertilLund/commit-webmcp
- Live app: https://commit-webmcp.pages.dev
- Real-client verification commit: current rollback release (15 WebMCP tools; evidence in `docs/webmcp-real-client-test.md`)
- Deployed application commit: `a568849` (functional transaction walkthrough, truthful WebMCP readiness, accessibility coverage, lint, and public CI).
- Final release tag: pending the current-build recording, YouTube upload, and Devpost draft.
- Cloudflare Pages project: `commit-webmcp`
- Current production deployment: https://fefb0cb2.commit-webmcp.pages.dev
- License: MIT
- Demo master: **not yet recorded from the current Shadcn build**. The existing `submission/media/commit-demo.mp4` is retired reference footage and must not be uploaded.
- Video URL: pending YouTube upload
- Devpost URL: pending Devpost login and draft creation
- Verified deadline: September 3, 2026, 1:00 PM Pacific / 22:00 CEST

## Verification record

- `npm run lint` succeeds with zero warnings.
- `npm run test` succeeds (10 tests: 4 transaction-engine tests, three human interaction flows including full rollback, two WebMCP browser-tool callback tests, and one primary-flow accessibility audit).
- `npm run build` succeeds.
- `npm audit` reports 0 known vulnerabilities.
- React Doctor reports 100/100 with no findings.
- A fresh public GitHub clone on 2026-08-29 completed `npm ci`, lint, all 10 tests, and the production build; its asset hashes matched the deployed application release.
- The live URL returned HTTP 200 on public verification.
- The public GitHub repository was verified as non-private with `main` default branch and an MIT license.
- A full real-client WebMCP run is documented in `docs/webmcp-real-client-test.md`.
