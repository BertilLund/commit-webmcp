# Commit

**Git for agent actions on the web.** Agents stage. Humans steer. Web apps commit.

Commit is a WebMCP-native commerce operations demo. An agent can inspect store data, build a multi-step clearance proposal in isolated shadow state, receive deterministic policy feedback, and request a human-bound atomic commit. The human reviews and can edit the same change set before approval.

## Live demo

[commit-webmcp.pages.dev](https://commit-webmcp.pages.dev)

## What makes it WebMCP-native

The app registers browser-mediated tools through `document.modelContext.registerTool()`. The tools are intentionally domain-level rather than click automation:

- Reads: store summary, product metrics, policies, shared change set, audit history
- Staging: begin a change set, stage prices, campaign, and featured placements
- Controls: deterministic validation, approval request, atomic approved commit, reset

Every tool shares the same domain functions as the UI. Tool activity is only shown when an actual WebMCP callback runs.

## Demo path

1. Use ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Open the live app and ask: “Prepare a weekend clearance campaign. Clear slow-moving inventory and maximize expected revenue. Never take a product below 25% gross margin, don’t discount products that are already selling well, create the campaign, and feature the five best opportunities.”
3. Review **Agent Changes**, manually edit one proposed price, then ask the agent to inspect the change set again.
4. The human approves the current revision and commits. Open **Commit History** to inspect the audit record.

For a deterministic UI-only walkthrough, select **Run guided clearance set**. This never pretends to be an agent call.

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build
```

The demo state is browser-local and includes **Reset demo** for a clean workspace.

## Architecture

`src/main.js` contains a small, explicit domain layer: canonical state, staged shadow composition, deterministic policies, revision-bound approval, atomic commit, and immutable audit records. Its static architecture keeps the challenge demo portable and offline-friendly; it deliberately contains no secrets or backend dependency.

## License

[MIT](LICENSE)
