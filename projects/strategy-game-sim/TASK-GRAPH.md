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
| SGS-127 | Named-build update 412: weak CDN etag in compare-and-swap | M9 | M9.1 | aoe4-build-order | high | | | sgs-127-blob-strong-etag | 8691f1e | integrated | | 138 | tickets/SGS-127-blob-strong-etag.md |
| SGS-128 | Shared test helpers and two jscpd gates | M9 | M9.11 | | standard | | | sgs-128-shared-test-helpers-and-jscpd-gates | 802e22208f1bc9dc2ca3dd72ace2ee7e660ff3f3 | integrated | 1 | 139 | tickets/SGS-128-shared-test-helpers-and-jscpd-gates.md |
| SGS-129 | Turn on strict in tsconfig | M9 | M9.13 | | low | | | sgs-129-strict-typescript | 0d103044bc8aa41f45ad6c53b1576d481f570d47 | integrated | | 140 | tickets/SGS-129-strict-typescript.md |
| SGS-130 | Blob store retry cap, landed write, live test | M9 | M9.10 | | high | SGS-127,SGS-128 | | sgs-130-blob-landed-write-retry-cap | 1c854a6 | integrated | 1 | 142 | tickets/SGS-130-blob-landed-write-retry-cap.md |
| SGS-134 | Chart layout model and key-results collapse | M9 | M9.4 | | standard | SGS-128 | | sgs-134-chart-layout-model-key-results-collapse | 68f6b8e | integrated | | 144 | tickets/SGS-134-chart-layout-model-key-results-collapse.md |
| SGS-136 | Simulator emits production buildings, OpenAPI 2.6.0 | M9 | M9.6 | | high | SGS-128 | | sgs-136-simulate-production-buildings-series | b97ddcb | integrated | | 145 | tickets/SGS-136-simulate-production-buildings-series.md |
| SGS-140 | Compact text-editor mode below 48rem | M9 | M9.8 | | low | SGS-128 | | sgs-140-editor-compact-mode | ffc4346 | integrated | | 146 | tickets/SGS-140-editor-compact-mode.md |
| SGS-131 | My builds: no wipe on bad value, backup | M9 | M9.10 | | standard | SGS-128 | | sgs-131-my-builds-no-wipe-and-backup | 500d8d0 | integrated | | 143 | tickets/SGS-131-my-builds-no-wipe-and-backup.md |
| SGS-132 | Save panel one row and live Saved status | M9 | M9.3 | | standard | SGS-128 | | sgs-132-save-panel-live-status | 5957bea | integrated | 1 | 141 | tickets/SGS-132-save-panel-live-status.md |
| SGS-135 | Chart header drag handle and caret | M9 | M9.4 | | standard | SGS-134 | | sgs-135-chart-header-drag-handle-and-caret | e58d41d | integrated | 1 | 148 | tickets/SGS-135-chart-header-drag-handle-and-caret.md |
| SGS-133 | Split-scroll anchoring and run-bar cap | M9 | M9.12 | | standard | SGS-132 | | sgs-133-split-scroll-anchoring-run-bar-cap | 2f504bc | integrated | | 147 | tickets/SGS-133-split-scroll-anchoring-and-run-bar-cap.md |
| SGS-137 | Gather-rates and units-produced view toggles | M9 | M9.6 | | standard | SGS-134,SGS-135,SGS-136,SGS-138 | | sgs-137-chart-view-toggles | | in_progress | | | tickets/SGS-137-chart-view-toggles.md |
| SGS-138 | Pinned runs: no tooltip entries, one legend entry | M9 | M9.5 | | low | SGS-135 | | sgs-138-pinned-runs-no-tooltip-one-legend-entry | 7556a2c | integrated | | 149 | tickets/SGS-138-pinned-runs-no-tooltip-one-legend-entry.md |
| SGS-139 | Marker legend hover and focus labels | M9 | M9.7 | | standard | SGS-138 | | sgs-139-marker-legend-hover-focus-labels | | in_progress | | | tickets/SGS-139-marker-legend-hover-focus-labels.md |
| SGS-141 | Tab-order spec and final docs pass | M9 | M9.9 | | low | SGS-130,SGS-131,SGS-132,SGS-133,SGS-137,SGS-138,SGS-139,SGS-140 | | | | spec_ready | | | tickets/SGS-141-split-tab-order-spec-and-final-docs-pass.md |
