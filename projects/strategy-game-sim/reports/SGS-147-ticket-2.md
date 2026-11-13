# SGS-147 ticket 2 (re-spec)

File: tickets/SGS-147-browser-storage-edge-cases.md. Lint passes.

Took option (a). The `recordCreated` criterion no longer claims the My builds group equals `readMyBuilds`. Scope now says the list may keep an entry storage evicted, and may drop a different entry than storage did. It gives the cause (`recordUpdated` keeps position, storage orders by `updatedAt`), and says reordering stays out of scope.

Other changes:
- The helper takes the selected key, and `recordCreated` passes it.
- The cap criterion now covers the selected entry being the oldest `mine` entry: another entry is dropped instead. It also says a test fails if the selected entry is dropped.
- The two-tab criterion names two pages in one browser context.
- A Re-spec 2 section was appended.

Size, risk, dependencies and open questions are unchanged (~40 LOC, low, none, none). No diagram is needed.
