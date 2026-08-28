# Commit

**Git for agent actions on the web.** Agents stage. Humans steer. Web apps commit.

Commit is a WebMCP-native commerce operations demo. An agent can inspect store data, build a multi-step clearance proposal in isolated shadow state, receive deterministic policy feedback, and request a human-bound atomic commit. The human reviews and can edit the same change set before approval.

## Live demo

[commit-webmcp.pages.dev](https://commit-webmcp.pages.dev)

## What makes it WebMCP-native

The app registers browser-mediated tools through `document.modelContext.registerTool()`. The tools are intentionally domain-level rather than click automation:

- Reads: store summary, product metrics, live campaigns, policies, shared change set, and audit history
- Staging: begin a change set, stage prices, campaign, featured placements, and a safe rollback
- Controls: deterministic validation, approval request, atomic approved commit, reset

Every tool shares the same domain functions as the UI. Tool activity is only shown when an actual WebMCP callback runs.

## Demo path

1. Use ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Open the live app and ask: “Prepare a weekend clearance campaign. Clear slow-moving inventory and maximize expected revenue. Never take a product below 25% gross margin, don’t discount products that are already selling well, create the campaign, and feature the five best opportunities.”
3. Open **Review**. The black “Your next action” panel tells you exactly what is safe to do next: approve the staged plan, then commit it. You can edit a proposed price before approval.
4. Open **History** to inspect the audit record or stage a separately approved rollback of the latest commit.

For a deterministic UI-only walkthrough, select **Run guided demo**. It explicitly does not pretend to be agent activity; the activity panel is reserved for actual WebMCP calls.

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
```

```bash
npm run test
```

The demo state is browser-local and includes **Reset demo** for a clean workspace.

## Verification evidence

`npm run test` runs four transaction-engine checks for hard policy blocking, approval invalidation after a human edit, atomic commit/audit persistence, and safe rollback.

The deployed app was tested on 2026-08-26 in Codex's WebMCP-capable in-app browser. Tool discovery exposed all 13 declared tools. The test staged a deliberately invalid $80 price for the Aster Field Jacket (blocked by the 25% gross-margin rule), corrected it to $109, staged a campaign and feature placement, then manually adjusted the shared price to $115 in the UI. The agent read the human revision, requested approval for revision 8, and committed only after the UI approval. The audit entry was created and `reset_demo` restored version 12 with no active change set. No browser console errors or warnings were observed.

The current release exposes 15 tools and separately verifies the safe rollback flow in the real client; see the detailed test record below.

See [the detailed test record](docs/webmcp-real-client-test.md).

## Architecture

`src/lib/domain.js` contains the shared domain layer: canonical state, staged shadow composition, deterministic policies, revision-bound approval, atomic commit, and immutable audit records. The React/shadcn review surface in `src/App.jsx` calls the same functions as the WebMCP handlers, so a human edit and an agent action cannot drift apart. The portable browser-local architecture deliberately contains no secrets or backend dependency.

## License

[MIT](LICENSE)
