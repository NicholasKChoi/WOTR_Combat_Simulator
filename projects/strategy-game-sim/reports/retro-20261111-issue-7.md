Ticket writer: scope grep criteria with word boundaries, exclude tests, and name the paths searched

## Problem
Four tickets in one milestone (SGS-116, SGS-118, SGS-120, SGS-124) bounced at spec-gate on a grep acceptance criterion that matched the wrong things: substrings of other names, or the test and spec files that mention the name on purpose. `agents/ticket.md` "Check criteria you can run" (lines 93-101) makes the writer run each search criterion against current code, but says nothing about how to scope the search, so a criterion can pass that check and still be wrong.

## Proposal
Add a bullet to `agents/ticket.md` "Check criteria you can run":

```
- A search criterion uses word boundaries (`git grep -w` or `\b`), excludes test and spec files
  unless they are its subject, and names the exact paths it searches.
```

## Evidence
strategy-game-sim retro 2026-11-11, pattern I: SGS-116 RS1 (Waited grep matched tests), SGS-118 RS1 (chart-id grep), SGS-120 (ifMatch grep), SGS-124 RS2 (initialB grep). Each was caught at spec-gate, costing one re-spec per ticket.
