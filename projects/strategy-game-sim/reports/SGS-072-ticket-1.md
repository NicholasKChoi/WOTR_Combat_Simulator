# SGS-072 ticket report

File: tickets/SGS-072-aoe4-pin-persistence-label.md. aoe4-build-order, standard risk, ~115 LOC business logic, depends on SGS-067 and SGS-069 (plus results.tsx rebase after SGS-070/071).
Covers M4.12: pin-storage.ts (C13), pin-name.ts, BuildInput selected/onSelectedChange, page pin/run-snapshot state, restore on load, results-stale, pinned-label, pin-run disabled when already pinned, docs, unit and 8 acceptance specs.
Diagram: Mermaid flowchart (read/act/record) for restore and storage.
Open questions (all designer): user pin before restore lands; name length cap; pin-storage.ts folder (design modules table says components/apps/..., outline said lib/); who removes an invalid stored value.
Greps run on origin/main: build-input setSelected/useState = 3 lines today; "survives later runs" = docs line 816; no localStorage/PIN_STORAGE_KEY/results-stale/pinned-label in code today.
