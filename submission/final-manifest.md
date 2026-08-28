# Final submission manifest

Status: **pre-submission — final links pending upload and Devpost draft**

- Project: Commit
- Tagline: Git for agent actions on the web.
- Repository: https://github.com/BertilLund/commit-webmcp
- Live app: https://commit-webmcp.pages.dev
- Real-client verification commit: current rollback release (15 WebMCP tools; evidence in `docs/webmcp-real-client-test.md`)
- Deployed application commit: `2e7121b` (SpaceX design system with a Shadcn visual transaction sequence).
- Current release-record commit: `2255bfa` (records the deployment below; final tag will point to the post-recording release commit).
- Cloudflare Pages project: `commit-webmcp`
- Current production deployment: https://e44028b8.commit-webmcp.pages.dev
- License: MIT
- Demo master: **not yet recorded from the current Shadcn build**. The existing `submission/media/commit-demo.mp4` is retired reference footage and must not be uploaded.
- Video URL: pending YouTube upload
- Devpost URL: pending Devpost login and draft creation
- Verified deadline: September 3, 2026, 1:00 PM Pacific / 22:00 CEST

## Verification record

- `npm run test` succeeds (8 tests: 4 transaction-engine tests, two human review interaction flows, and two WebMCP browser-tool callback tests).
- `npm run build` succeeds.
- The live URL returned HTTP 200 on public verification.
- The public GitHub repository was verified as non-private with `main` default branch and an MIT license.
- A full real-client WebMCP run is documented in `docs/webmcp-real-client-test.md`.
