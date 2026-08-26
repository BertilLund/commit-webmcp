# Commit demo script — 2:29 target

## 0:00–0:14 — Control problem

**Visual:** Agent Changes empty state, then the staged-change hero.

**Narration:**

> Agents can now operate web apps, but there is a control problem. Approving every small action creates fatigue. Giving an agent direct access to make dozens of changes creates risk.

## 0:14–0:28 — Thesis

**Visual:** Commit’s empty review surface and its three-step stage / review / commit explanation.

**Narration:**

> Commit is Git for agent actions on the web. Agents stage. Humans steer. Web apps commit.

## 0:28–1:13 — Agent builds an isolated plan

**Visual:** WebMCP activity panel as the agent reads policies and catalog signals, then the proposed diff appearing.

**Narration:**

> In this merchant workspace, a WebMCP agent reads product metrics, inventory, and policies. It builds a clearance plan in shadow state: price changes, featured placements, and a weekend campaign. None of these changes are live yet.

## 1:13–1:32 — Deterministic guardrail

**Visual:** Below-margin price change marked blocked; corrected proposal marked valid.

**Narration:**

> The agent first proposes a price that would break the store’s 25 percent gross-margin rule. Commit returns a structured block. The agent corrects the price, and deterministic validation—not model judgment—clears the plan.

## 1:32–1:57 — Shared state

**Visual:** Human price editor; revised price and revision number update.

**Narration:**

> Now the human steers the same change set. They raise one proposed price. That increments the revision, invalidates any prior approval, and the agent can read the updated state before asking to commit.

## 1:57–2:19 — One approval, atomic commit

**Visual:** Approval action, committed success bar, then the Catalog view showing the canonical price change.

**Narration:**

> Approval is bound to this exact revision. Once the human approves, the agent can commit the complete plan atomically. The canonical catalog and storefront change together.

## 2:19–2:36 — Audit trail and safe reversal

**Visual:** Commit History with ID, actor, timestamp, and the “Stage rollback” action; then the staged rollback review.

**Narration:**

> Every commit leaves a concise audit record with the actor, revision, time, and diff. If the latest commit needs to be undone, rollback is staged as a new reviewable change set and requires another human approval.

## 2:36–2:42 — Close

**Visual:** Commit mark and the final review screen.

**Narration:**

> Commit lets agents collaborate safely at a higher level of abstraction: stage the work, steer the outcome, and commit with confidence.
