# Submission media

- `commit-demo.mp4` — prior H.264/AAC demo master. It remains useful as an editing reference, but it must be re-recorded from the current public build before submission because the review UI was deliberately simplified after these captures.
- `commit-narration.mp3` — narration source.
- `commit-narration.txt` — narration transcript used to produce the source audio.
- `empty-state.png` — initial review surface.
- `policy-blocked.png` — actual WebMCP policy block at 13% gross margin.
- `proposed-review.png` — staged change-set review.
- `human-editor.png` — accessible human edit of a proposed price.
- `committed-state.png` — atomic commit result.
- `commit-history.png` — resulting audit history.
- `history-rollback.png` — the latest reversible audit record with its staged rollback action.
- `rollback-review.png` — the separately reviewable reversal before approval.
- `commit-review.png` — production-build capture of the 13-change guided walkthrough after a human revision.

The application captures were taken from a production build of Commit on 2026-08-26. The WebMCP behavior itself was separately re-verified in Codex’s WebMCP-capable in-app browser after the redesign. Do not present these older captures as the final submission media; the recording runbook and script now target the current deployed UI.

The final capture must come from release `a568849` / Cloudflare deployment `fefb0cb2`. Its unmistakable first functional state is the white policy-result card showing `$80 → 13% → Blocked`; any media without that card is from a retired interface.
