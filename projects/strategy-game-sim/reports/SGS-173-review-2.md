# SGS-173 review 2

Delta mode, text-only Rework 1. Reviewed b76e8dd..f94418cd6b86994edabbc628b18a9a8aa7326d79 (2 files, +4/-3). Verdict: **APPROVE**.

## Required fixes
1. ARCHITECTURE.md route-logic row: the replacement text is verbatim as directed. `RouteReply<Body>`/`sendReply` body-type rule and `errorReply`/`storageUnavailable`/`idFailure` in `builds-routes.ts` are restored. Kept facts all survive: `api-route.ts` shared contents and no-server-only-import reason, route-logic files return a reply, `named-builds.ts` browser-safe contents, route files only adapt `req`/`res`. The row is still four sentences: pass.
2. docs/aoe4-build-order-format.md Blob store first bullet: verbatim as directed. It lists only `getNamed` and the counter read, keeps the uncompressed header, strong etag for `ifMatch`, weak etag throws and 503, and adds that the read-back's errors count as not landed: pass.

The diff touches nothing else. The other acceptance criteria were approved in review 1 and are unchanged.

## Non-blocking notes
- The CONTEXT.md Design docs row note from review 1 still stands (owner's call).

## Coverage
Delta diff only. The scratch checkout was not created; I read the task worktree at f94418c. Nothing to remove.
