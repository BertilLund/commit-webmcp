# Live WebMCP real-client test

Date: 2026-08-26  
Client: Codex in-app browser  
Deployment: https://commit-webmcp.pages.dev

## Tool discovery

The current monochrome production build exposes 15 `document.modelContext` tools with strict schemas:

`get_store_summary`, `list_products`, `get_store_policies`, `begin_changeset`, `stage_price_change`, `stage_featured_product`, `stage_campaign`, `list_campaigns`, `get_changeset`, `validate_changeset`, `request_commit`, `commit_approved_changes`, `get_commit_history`, `begin_rollback`, and `reset_demo`.

## Executed flow

1. Read the canonical store summary and policy configuration.
2. Started `WebMCP Clearance Validation` at canonical store version 12.
3. Staged `p01` (Aster Field Jacket) at $80. Validation returned one blocked result: its resulting gross margin was below the required 25%.
4. Corrected `p01` to $109. Validation returned two passing price-policy checks at 36% gross margin.
5. Staged a valid campaign and a featured-product placement, then validated and requested human approval.
6. Used the human UI editor to adjust the proposed price to $115. The shared change set advanced to revision 8; it recorded `source: human`, an updated 39% margin, and no approval.
7. Read the human-modified change set with `get_changeset`, then requested approval for revision 8 and content hash `revision-8-3-951`.
8. Approved revision 8 in the UI, then invoked `commit_approved_changes`. The resulting audit commit was `CMT_2ZGV5E` with three changes.
9. Read commit history and confirmed the new audit record with actor attribution `Human approval · agent staged`.
10. Invoked `reset_demo`; a new `get_store_summary` returned store version 12, 20 products, and no active change set.

## Current rollback verification

After the UI redesign and rollback release, the same supported Codex in-app browser completed this additional production run:

1. `reset_demo` restored canonical store version 12.
2. The client began `Rollback client test`, staged a valid $109 price, a featured placement, and campaign `Rollback verification`, then requested approval for revision 4.
3. A human approved revision 4 in the UI. `commit_approved_changes` created `CMT_PB0DLI` and persisted the three reversible changes.
4. The agent read commit history and called `begin_rollback` with `CMT_PB0DLI`. The app staged a separate `Rollback CMT_PB0DLI` change set at canonical version 13 with inverse price, placement, and campaign-removal actions. Nothing was live at this stage.
5. A human approved that rollback revision in the UI. `commit_approved_changes` then created `CMT_MAR3PP`.
6. The agent confirmed the canonical result: Aster Field Jacket was back to `$148`, `featured: false`, and `list_campaigns` returned an empty array.

Browser development logs had zero warnings and zero errors during the completed flows.

## Notes

The production app intentionally stores the fictional demo workspace in the browser to eliminate accounts, credentials, and external data dependencies for judges. Tool callbacks and UI actions share the same domain functions, so this client-local persistence does not create a second behavior path.
