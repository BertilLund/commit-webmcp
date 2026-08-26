# Bounded novelty scan

Checked 2026-08-26: official WebMCP explainer and challenge examples/showcase references.

The WebMCP explainer includes examples of agents editing designs as batches of uncommitted changes, plus commerce search/filtering and code-review suggested edits. Those validate the general direction, but they do not demonstrate a full transactional collaboration model: an explicit shadow state, domain policy engine, revision-bound human approval, atomic commit, and audit trail in one user-facing product.

Commit is positioned deliberately as a reusable interaction primitive rather than an AI store operator:

- Agent mutations are staged, not live.
- Deterministic policies decide hard constraints, not model judgment.
- The human can modify the same staged state; that invalidates approval by revision.
- Commit is atomic and leaves a concise audit record.
- Commerce is the concrete example; cloud, CRM, billing, and workspace administration are future applicability, not claimed integrations.

The name "Commit" is a common generic word, so copy consistently uses **Commit — Git for agent actions on the web** to establish context and avoid implying affiliation with any existing product.
