# SGS-151 lane intake

Type: Chore
Priority: low
Milestone: none
Working title: One shared in-memory Blob test fake
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- Three hand-written in-memory Blob fakes (blob-build-store.test.ts:36-63 counterBlob, blob-lost-writes.acceptance.test.ts:22-71, named-build-store.acceptance.test.ts); a shared test-support fake would replace all (SGS-130 review 3).
