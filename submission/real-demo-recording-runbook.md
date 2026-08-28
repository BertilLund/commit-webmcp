# Real WebMCP demo recording runbook

Use this only in a WebMCP-capable browser. The recording must show real browser tool calls, not the guided demo.

1. Open the public app, reset the demo, and keep **Review** visible.
2. Ask the agent to create a weekend clearance change set and inspect the catalog/policies.
3. Record actual calls to `begin_changeset`, `stage_price_change`, `stage_featured_product`, `stage_campaign`, and `validate_changeset` appearing in the collapsed **Agent activity** panel.
4. Have the agent stage Aster Field Jacket at `$80`; show the structured blocked validation result.
5. Have the agent correct Aster Field Jacket to `$109`; show the now-safe plan.
6. Expand the change details. Use **Edit** to make a human price change to `$115`, then have the agent call `get_changeset` so the real activity list shows the shared-state read.
7. Click **Approve changes** in the persistent black panel. Let the agent call `commit_approved_changes`; the panel now shows **Changes are live**.
8. Open **History**, click **Stage rollback**, approve the rollback plan, and let the agent commit it. Verify the reverted price in **Catalog**.

The UI deliberately labels the guided demo and never writes fake agent activity; do not use it for the recorded WebMCP proof.
