# Final submission manifest

Status: **pre-submission — final links pending upload and Devpost draft**

- Project: Commit
- Tagline: Git for agent actions on the web.
- Repository: https://github.com/BertilLund/commit-webmcp
- Live app: https://commit-webmcp.pages.dev
- Real-client verification commit: current rollback release (15 WebMCP tools; evidence in `docs/webmcp-real-client-test.md`)
- Submission candidate commit: `0628bdd` (clear one-decision-at-a-time review flow; to be tagged immediately before Devpost submission).
- Cloudflare Pages project: `commit-webmcp`
- Current production deployment: https://eb3067b3.commit-webmcp.pages.dev
- License: MIT
- Demo master: `submission/media/commit-demo.mp4` (1:45, H.264/AAC, 1280×720)
- Video URL: pending YouTube upload
- Devpost URL: pending Devpost login and draft creation
- Verified deadline: September 3, 2026, 1:00 PM Pacific / 22:00 CEST

## Verification record

- `npm run test` succeeds (6 tests: 4 transaction-engine tests plus two human review interaction flows).
- `npm run build` succeeds.
- The live URL returned HTTP 200 on public verification.
- The public GitHub repository was verified as non-private with `main` default branch and an MIT license.
- A full real-client WebMCP run is documented in `docs/webmcp-real-client-test.md`.
