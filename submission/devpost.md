# Commit

**Git for agent actions on the web.**

WebMCP lets agents act on websites. Commit adds the missing collaboration layer: agents stage a coherent set of operational changes in shadow state, humans review and modify the diff, deterministic policies validate it, and the approved revision commits atomically with an audit trail.

## The problem

As agents perform stateful web work, the common control models break down. Asking for approval after every small action creates approval fatigue. Giving broad, immediate write access creates risk.

## What Commit demonstrates

The demo uses a fictional merchant workspace preparing a weekend clearance campaign. A compatible browser agent reads the catalog, inventory signals, policies, and active change set. It can stage price changes, featured placements, and a campaign without touching live store data. The policy engine blocks below-margin discounts and protects strong sellers. A human reviews the coherent diff, can edit a proposed price, then approves the exact revision. Only then can the change set commit atomically.

## Why WebMCP

Commit exposes structured, browser-native tools through `document.modelContext.registerTool`. These are domain-level operations rather than click automation: inspect the store, create and inspect a change set, stage mutations, validate deterministic policies, request approval, commit an approved revision, and inspect audit history. The tools and UI use the same domain functions, so agent activity and human review stay in sync.

## What people and agents can do together

The agent can freely assemble a multi-step proposal while the human remains in control of the outcome rather than individual clicks. The human can steer the proposal in the shared state; approval invalidates automatically when the revision changes. The result is a more practical control surface for high-consequence agent actions.

## Implementation

Commit is a dependency-light browser application with deterministic seeded data. It implements canonical versus shadow state composition, a deterministic policy engine, revision-bound approvals, atomic commit preconditions, local audit records, and real WebMCP registration. The app is intentionally usable without a login and includes a one-click reset for reliable judging.

## Judge testing

1. Open the live URL in ChatGPT's in-app browser, or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Ask: “Prepare a weekend clearance campaign. Clear slow-moving inventory and maximize expected revenue. Never take a product below 25% gross margin, don’t discount products that are already selling well, create the campaign, and feature the five best opportunities.”
3. Review **Agent Changes**. Edit one proposed price, then ask the agent to inspect the change set again.
4. Approve the exact revision and commit. Open **Commit History** for the audit record.

For a deterministic UI-only walkthrough, select **Run guided clearance set**. This is labelled as a guided demo and does not claim to be agent activity.
