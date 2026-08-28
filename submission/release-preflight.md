# Final release preflight

Run this only after recording the current real-browser WebMCP demo and before the Devpost submission deadline.

## Release evidence

- [ ] Current source is clean: `git status --short` prints nothing.
- [ ] `npm run test` passes all 8 tests.
- [ ] `npm run build` passes.
- [ ] The deployed production build is the same app revision intended for judging.
- [ ] The public live URL opens without login and shows the WebMCP compatibility state without crashing in a normal browser.
- [ ] The actual compatible-browser recording shows tool discovery, policy block/correction, human edit, human approval, agent commit, and safe rollback.

## Submission evidence

- [ ] The newly recorded video is public on YouTube, under three minutes, and has clear English audio.
- [ ] The YouTube description points to the public app and repository.
- [ ] Devpost project text comes from `submission/devpost.md` and testing steps match the public app.
- [ ] The Devpost entry uses the current screenshot(s), not the retired capture set.
- [ ] The live app, repository, and video links are opened once after they are entered.

## Freeze

1. Create an annotated release tag for the exact source revision: `git tag -a submission-2026-09-03 -m "WebMCP Challenge submission"`.
2. Push the tag: `git push origin submission-2026-09-03`.
3. Record the tag, SHA, deployment URL, YouTube URL, Devpost URL, and submission timestamp in `submission/final-manifest.md`.
4. Submit before **September 3, 2026, 1:00 PM PDT**.
5. Do not edit the Devpost submission after the deadline except for a sponsor-approved corrective change. The official rules permit updating the separate Devpost portfolio project after the deadline, but this submission should remain frozen for reliable judging.
