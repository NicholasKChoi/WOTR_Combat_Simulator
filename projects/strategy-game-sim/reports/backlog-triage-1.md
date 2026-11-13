# Backlog triage 1 (2026-11-12)

The work-type change moves bugs and chores out of milestones and into the lane. Numbers are BACKLOG.md bullet order after cleanup.
Removed already: 23 bullets that M9 delivered (M9.3-M9.13; SGS-127..141), plus #45, which #29 supersedes.

## Proposed lane tickets (related bullets merged into one ticket each)

| ticket | type | priority | bullets |
|---|---|---|---|
| L1 replaceNamed answers 503 not 409 on a key deleted mid-update; live test 1 asserts the class | Bug | high | 29 |
| L2 Run bar: focus ring clipped in the capped bar; useRunBarHeight ceil leaves 1px | Bug | medium | 26, 20 |
| L3 rem sizing assumes 16px root (root is 18px): compact-mode threshold and other M9 rem sizes | Bug | medium | 18 |
| L4 Buildings view lists Abbey of Kings as a production building | Bug | low | 27 |
| L5 Chart layout: two activations in one render lose one; arrow keys mid-drag leave stale start | Bug | low | 12, 23 |
| L6 Browser storage edges: readStoredPin wipes on bad parse; cross-tab clear and 50 cap only on reload; recordCreated ordering | Bug | low | 17, 14 |
| L7 isLineHidden strips `pinned:` from any key (latent) | Bug | low | 8 |
| L8 Test hardening: spec waits after `running`; memory-store env test cannot fail; tab-order spec masked asserts | Chore | low | 10, 13, 28 |
| L9 Acceptance flakes: small-screen :42, step-band :143 | Chore | low | 5, 24 |
| L10 One shared in-memory Blob fake | Chore | low | 22 |
| L11 Docs wording: pinned-line colour, ARCHITECTURE @vercel/blob importers | Chore | low | 9, 19 |
| L12 Smoke script hardening (SGS-106 review notes, incl. bypass header on cross-origin redirect) | Chore | medium | 7 |
| L13 Re-add acceptance coverage removed by SGS-098 | Chore | low | 4 |
| L14 Data freshness CI job (first GitHub workflow) | Chore | low | 1 |

## Not lane
- Milestone (adds behavior or needs data research): 2 provisional gather rates, 3 English economy/Blacksmith gaps.
- No ticket; the manager fixes them in the state-dir design docs at M9 close: 16, 25.
- Drop: 6 (pin name lag is per spec), 11 (redundant CSS the spec cannot pin), 15 (the design accepts it; also #15's recordCreated half is in L6), 21 (SGS-133 integrated, so moot).
