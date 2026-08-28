# WebMCP Challenge requirements

Verified 2026-08-28 from the [OpenAI challenge page](https://openai.com/webmcp-challenge/) and [Devpost official rules](https://webmcp.devpost.com/rules).

## Deadline

- Registration and submission deadline: **September 3, 2026, 1:00 PM PDT** (22:00 CEST / Copenhagen).
- Registration and submission period: August 25, 11:00 AM PT through the deadline.
- Work to the earlier, official Devpost time; OpenAI's page matches it.

## Submission checklist

- A working live URL accessible in ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled, available free and without restriction through the judging period.
- A public GitHub, GitLab, or Bitbucket repository containing source, assets, setup instructions, and a visible/detectable open-source license.
- English project text explaining WebMCP fit, the better human-agent experience, what becomes possible together, and the implementation.
- A publicly visible YouTube demo under three minutes, with audio explaining the working product and WebMCP use. It must not contain unlicensed copyrighted material or third-party trademarks.
- English text, video, and testing instructions (or English translations).
- Free, unrestricted judge access through the end of the judging period; private apps need test credentials in the submission form.
- The project must be new in the submission period or meaningfully extended with WebMCP during it. Pre-existing work needs dated evidence of the extension.

## Eligibility notes

Entrants must be the age of majority locally and resident/organized in an OpenAI API-supported country or territory. The official rules include exclusions and restrictions; the entrant must confirm their own eligibility. The current rules allow multiple unique, substantially different submissions.

## Judging

Stage one is a viability check. Stage two weights four categories equally:

1. WebMCP Leverage
2. Execution
3. Potential Impact
4. Creativity & Ambition

Ties are broken first by WebMCP Leverage. After the deadline, Devpost submissions cannot be edited except when Devpost/Sponsor permits a limited corrective change; the project may still be updated in the entrant's Devpost portfolio.

## Product implications for Commit

Commit registers browser-native imperative tools through `document.modelContext.registerTool`, supplies a visible human/agent shared state, avoids login, uses local deterministic seed data, and includes a WebMCP compatibility message for unsupported browsers.
