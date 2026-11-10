# SGS-106 implementer 2 (rework 1, text only)

Branch sgs-106-smoke-preview, tip 0aee0751a40e8e7ac9159cb9bb682770f75412d4.

Change: docs/aoe4-build-order.md smoke step 1 (it was on lines 1103-1104, not 1104 alone) is now exactly the text in the checklist. Only file touched.

Local verification: BUILDS_LOCAL_DIR=/tmp/claude-1000/tmp.Vv70U00NI6, `npm run dev -- -p 3123`, `npm run smoke:preview -- http://localhost:3123`, twice.
Run 1 and run 2 each printed (exit 0):
PASS save: 201 8NZwU5Ld_D5
PASS read back
PASS open
PASS delete
Both runs show the same id and 201, since the build was deleted by run 1.
Port 3123. The dev server was stopped afterwards (curl to the port fails). The throwaway dir holds no build record; its only file is development/rate-limit/PkjvnSLgltpoOFQP.json, a rate-limit counter. No bypass secret was printed.
Note: a first attempt at the run was blocked before anything ran; an early dev server started once without BUILDS_LOCAL_DIR was killed before any request was sent.

Status: needs_review
