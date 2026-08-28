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
3. Select **Stage an unsafe price**. The real transaction engine proposes `$80`, calculates a 13% margin, and visibly blocks it against the 25% store policy while the canonical store remains untouched.
4. Select **Correct to $109 and build the plan**. The same domain functions used by WebMCP create the 13-change shadow transaction. The telemetry and price vectors update from actual staged state.
5. Select **Approve this plan**, then **Apply these changes** to atomically update the store. Expand **Inspect 13 changes** to edit a proposed price and invalidate the old approval first.
5. After commit, select **See the audit record** to inspect the live transaction or create a separately approved rollback plan.

The deterministic browser walkthrough runs the real policy, shadow-state, approval, commit, audit, and rollback engine. It does not pretend its clicks are WebMCP activity; **Real WebMCP calls only** is populated exclusively by compatible-agent tool execution.

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

`npm run test` runs eight checks: four transaction-engine checks for hard policy blocking, approval invalidation after a human edit, atomic commit/audit persistence, and safe rollback; two interaction tests that click through the actual review UI; and two browser-tool tests that verify all 15 WebMCP registrations, strict schemas, structured policy feedback, and approval-gated commit behavior through the real callback wrapper.

The deployed app was tested on 2026-08-26 in Codex's WebMCP-capable in-app browser. Tool discovery exposed all 15 declared tools. The test staged a deliberately invalid $80 price for the Aster Field Jacket (blocked by the 25% gross-margin rule), corrected it to $109, staged a campaign and feature placement, then manually adjusted the shared price to $115 in the UI. The agent read the human revision, requested approval for revision 8, and committed only after the UI approval. The audit entry was created and `reset_demo` restored version 12 with no active change set. No browser console errors or warnings were observed.

The current release exposes 15 tools and separately verifies the safe rollback flow in the real client; see the detailed test record below.

See [the detailed test record](docs/webmcp-real-client-test.md).

## Architecture

`src/lib/domain.js` contains the shared domain layer: canonical state, staged shadow composition, deterministic policies, revision-bound approval, atomic commit, and immutable audit records. The React/shadcn review surface in `src/App.jsx` calls the same functions as the WebMCP handlers, so a human edit and an agent action cannot drift apart. The portable browser-local architecture deliberately contains no secrets or backend dependency.

## License

[MIT](LICENSE)
