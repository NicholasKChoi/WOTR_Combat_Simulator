# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-112 | Server debt: typed replies, fail-closed env, id failure 500 | M8 | M8.6,M8.7,M8.8 | aoe4-build-order | high | | | sgs-112-server-debt | ea1b9246467f558ea54f7314331cec3ef713e85d | integrated | | 132 | tickets/SGS-112-server-debt-typed-replies-fail-closed.md |
| SGS-113 | Chart legend: one item per series, pinned key | M8 | M8.4 | aoe4-build-order | low | | | sgs-113-chart-legend | 41357ecb0e9b8ad74665c3d5107a6853716797cd | integrated | | 123 | tickets/SGS-113-chart-legend-one-item-per-series.md |
| SGS-114 | Collapse and move result charts, persisted | M8 | M8.2,M8.9 | aoe4-build-order | standard | | | sgs-114-chart-layout | 55ed3a13190549f3d9b8f56567ddb126573630a4 | integrated | | 126 | tickets/SGS-114-chart-layout.md |
| SGS-115 | Separate column scrolling and consistent headings | M8 | M8.3,M8.9 | aoe4-build-order | standard | | | sgs-115-split-scroll | aff346c084a0aa15d003ad1932e1c431512763df | integrated | 2 | 133 | tickets/SGS-115-split-scroll-columns-headings.md |
| SGS-116 | Step table and editor readability | M8 | M8.5 | aoe4-build-order | low | | | sgs-116-step-table-readability | 5ade9f035288390ea9f36c1ac31e4233c148e168 | integrated | | 127 | tickets/SGS-116-step-table-readability.md |
| SGS-117 | Unit test debt, settledFields, README | M8 | M8.6,M8.7,M8.8 | aoe4-build-order | low | | | sgs-117-unit-test-debt | 612a4f3131c5e96aa6843f93456a5b1ec6a4ca45 | integrated | | 124 | tickets/SGS-117-unit-test-debt-settled-fields-readme.md |
| SGS-118 | Acceptance test debt: shared hold helper | M8 | M8.7,M8.8 | aoe4-build-order | standard | | | sgs-118-acceptance-test-debt | 022fa41920739b7e3a552dc322f12f550d5c6a6b | integrated | | 128 | tickets/SGS-118-acceptance-test-debt.md |
| SGS-119 | Named-build library: ids, secrets, shapes | M8 | M8.1 | aoe4-build-order | standard | | | sgs-119-named-build-shapes | 58a1baa085ef53445d2db77b83f2b23a069c4b2f | integrated | 1 | 125 | tickets/SGS-119-named-build-shapes.md |
| SGS-120 | Named-build store methods (memory, file, Blob) | M8 | M8.1 | aoe4-build-order | high | SGS-112,SGS-119 | | sgs-120-named-routes | c09b34d | integrated | 1 | 134 | tickets/SGS-120-named-build-store-methods.md |
| SGS-122 | Named-build client and shared fetch helper | M8 | M8.1 | aoe4-build-order | standard | SGS-119 | | sgs-122-named-build-client | ab882831feb0118ad7a050a9154078f8c26ee2f5 | integrated | | 131 | tickets/SGS-122-named-build-client-shared-fetch.md |
| SGS-123 | My-builds storage, library, query, discard guard | M8 | M8.1,M8.6 | aoe4-build-order | standard | SGS-119 | | sgs-123-my-builds-library | ec51ae626902fdc8fd4b0caad8f33594d03ec6d8 | integrated | | 129 | tickets/SGS-123-my-builds-library-query-discard-guard.md |
| SGS-121 | Named-build routes, adapters, OpenAPI 2.5.0 | M8 | M8.1 | aoe4-build-order | high | SGS-112,SGS-119,SGS-120 | | sgs-121-named-build-routes | 3723ca5 | integrated | | 135 | tickets/SGS-121-named-build-routes-openapi.md |
| SGS-124 | Page: library select, edited marker, discard guard, ?n= load | M8 | M8.1,M8.6,M8.9 | aoe4-build-order | high | SGS-114,SGS-122,SGS-123 | | sgs-124-page-library | a0d658a | integrated | 1 | 136 | tickets/SGS-124-page-library-select-edited-marker-discard-guard.md |
| SGS-125 | Save panel rewrite: Save as copy, Save a new version | M8 | M8.1,M8.9 | aoe4-build-order | high | SGS-118,SGS-121,SGS-124 | | sgs-125-save-panel | 731699d | integrated | 1 | 137 | tickets/SGS-125-save-panel-rewrite-copy-and-versions.md |
| SGS-126 | Fix the pin-compare pinned-only legend test fixture | M8 | M8.4 | | low | | | sgs-126-pin-compare-fixture | 80da26a473a3f875d16cdfb91d421fb156714d5c | integrated | | 130 | tickets/SGS-126-pin-compare-pinned-only-legend-fixture.md |
| SGS-127 | Named-build update 412: weak CDN etag in compare-and-swap | M9 | | | high | | | | | draft | | | tickets/SGS-127-blob-strong-etag.md |
