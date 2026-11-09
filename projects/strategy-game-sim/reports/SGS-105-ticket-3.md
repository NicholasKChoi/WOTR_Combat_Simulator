# SGS-105 ticket 3 (re-spec, spec gate 1)

File: .claude/code-factory/projects/strategy-game-sim/tickets/SGS-105-save-and-open-by-link.md

- Wiring greps: navigator.clipboard and builds-URL greps now exclude ':!*.test.ts'.
- Scope item 8: URL comparison runs only while status !== 'loading' (matches designer pass 4: loading with settled equal to args before the mount effect and while held); failed load baseline equals default so no wait. Late save response (input differs from settled) shows no panel, no router.replace, baseline unmoved. New criterion pins both.
- Item 4: conversion.order read only when status is current.
- Existing-tests rule restated in Scope, naming narrow-layout and run-bar height specs.
- Re-spec change-log entry appended. Open questions: none. No diagram change. Size unchanged (~205). No overlap changes.
- Not run: no command-based criteria added beyond greps (grep exclusions are by construction).
