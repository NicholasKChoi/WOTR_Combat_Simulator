# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-112 | Server debt: typed replies, fail-closed env, id failure 500 | M8 | M8.6,M8.7,M8.8 | aoe4-build-order | high | | | | | draft | | | tickets/SGS-112-server-debt-typed-replies-fail-closed.md |
| SGS-113 | Chart legend: one item per series, pinned key | M8 | M8.4 | aoe4-build-order | low | | | | | draft | | | tickets/SGS-113-chart-legend-one-item-per-series.md |
| SGS-114 | Collapse and move result charts, persisted | M8 | M8.2,M8.9 | aoe4-build-order | standard | | | | | draft | | | tickets/SGS-114-chart-layout.md |
| SGS-115 | Separate column scrolling and consistent headings | M8 | M8.3,M8.9 | aoe4-build-order | standard | | | | | draft | | | tickets/SGS-115-split-scroll-columns-headings.md |
| SGS-116 | Step table and editor readability | M8 | M8.5 | aoe4-build-order | low | | | | | draft | | | tickets/SGS-116-step-table-readability.md |
| SGS-117 | Unit test debt, settledFields, README | M8 | M8.6,M8.7,M8.8 | aoe4-build-order | low | | | | | draft | | | tickets/SGS-117-unit-test-debt-settled-fields-readme.md |
| SGS-118 | Acceptance test debt: shared hold helper | M8 | M8.7,M8.8 | aoe4-build-order | standard | | | | | draft | | | tickets/SGS-118-acceptance-test-debt.md |
| SGS-119 | Named-build library: ids, secrets, shapes | M8 | M8.1 | aoe4-build-order | standard | | | | | draft | | | tickets/SGS-119-named-build-shapes.md |
| SGS-120 | Named-build store methods (memory, file, Blob) | M8 | M8.1 | aoe4-build-order | high | SGS-112,SGS-119 | | | | draft | | | tickets/SGS-120-named-build-store-methods.md |
| SGS-122 | Named-build client and shared fetch helper | M8 | M8.1 | aoe4-build-order | standard | SGS-119 | | | | draft | | | tickets/SGS-122-named-build-client-shared-fetch.md |
| SGS-123 | My-builds storage, library, query, discard guard | M8 | M8.1,M8.6 | aoe4-build-order | standard | SGS-119 | | | | draft | | | tickets/SGS-123-my-builds-library-query-discard-guard.md |
| SGS-121 | Named-build routes, adapters, OpenAPI 2.5.0 | M8 | M8.1 | aoe4-build-order | high | SGS-112,SGS-119,SGS-120 | | | | draft | | | tickets/SGS-121-named-build-routes-openapi.md |
| SGS-124 | Page: library select, edited marker, discard guard, ?n= load | M8 | M8.1,M8.6,M8.9 | aoe4-build-order | high | SGS-114,SGS-122,SGS-123 | | | | draft | | | tickets/SGS-124-page-library-select-edited-marker-discard-guard.md |
