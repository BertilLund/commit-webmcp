# Commit

**Git for agent actions on the web.**

Live demo: https://commit-webmcp.pages.dev  
Public source: https://github.com/BertilLund/commit-webmcp

WebMCP lets agents act on websites. Commit adds the missing collaboration layer: agents stage a coherent set of operational changes in shadow state, humans review and modify the diff, deterministic policies validate it, and the approved revision commits atomically with an audit trail.

## The problem

As agents perform stateful web work, the common control models break down. Asking for approval after every small action creates approval fatigue. Giving broad, immediate write access creates risk.

## What Commit demonstrates

The demo uses a fictional merchant workspace preparing a weekend clearance campaign. A compatible browser agent reads the catalog, inventory signals, policies, live campaigns, and active change set. It can stage price changes, featured placements, and a campaign without touching live store data. The policy engine blocks below-margin discounts and protects strong sellers. A human reviews the coherent diff, can edit a proposed price, then approves the exact revision. Only then can the change set commit atomically; the latest commit can later be staged as a separately approved rollback.

## Why WebMCP

Commit exposes structured, browser-native tools through `document.modelContext.registerTool`. These are domain-level operations rather than click automation: inspect the store, create and inspect a change set, stage mutations, validate deterministic policies, request approval, commit an approved revision, inspect audit history, and stage a reviewable rollback. The tools and UI use the same domain functions, so agent activity and human review stay in sync.

## What people and agents can do together

The agent can freely assemble a multi-step proposal while the human remains in control of the outcome rather than individual clicks. The human can steer the proposal in the shared state; approval invalidates automatically when the revision changes. The result is a more practical control surface for high-consequence agent actions.

## Implementation

Commit is a React application using Tailwind, shadcn component patterns, and Radix accessibility primitives with deterministic seeded data. It implements canonical versus shadow state composition, a deterministic policy engine, revision-bound approvals, atomic commit preconditions, local audit records, safe reviewable reversal, and real WebMCP registration. The app is intentionally usable without a login and includes a one-click reset for reliable judging.

## Judge testing

1. Open the live URL in ChatGPT's in-app browser, or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Ask: “Prepare a weekend clearance campaign. Clear slow-moving inventory and maximize expected revenue. Never take a product below 25% gross margin, don’t discount products that are already selling well, create the campaign, and feature the five best opportunities.”
3. The page says **Not live** until the exact plan is approved. Expand **See all 13 individual changes**, edit one proposed price, then ask the agent to inspect the change set again.
4. Approve the exact revision and let the agent commit. The UI-only fallback is **Approve this plan**, then **Apply these changes**. Select **See the audit record** after commit to create a safe rollback plan for a fresh review.

For a deterministic UI-only walkthrough, select **Create a clearance plan**. This is labelled as a guided demo and does not claim to be agent activity.
