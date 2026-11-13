# SGS-142 lane intake

Type: Bug
Priority: high
Milestone: none
Working title: replaceNamed answers 503 not 409 on a key deleted mid-update; live test 1 asserts the error class
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- lib/aoe4-build-order/blob-build-store.ts replaceNamed: live run (owner, 2026-11-12, npm run test:blob-live) shows put with ifMatch on a missing key raises a plain BlobError 'The specified key does not exist.' (SDK bad_request), not BlobNotFoundError/BlobPreconditionFailedError, so replaceNamed rethrows and PUT on a named build deleted between read and write answers 503 instead of the 409 changed reply. Fix: on a put error that is not 'landed', head the key and return 'conflict' when it is absent. Also blob-build-store.live.test.ts test 1 passes on any Error (it passed on BlobOidcEnvironmentNotAllowedError); assert the class. Reported by SGS-130 owner live verification.
