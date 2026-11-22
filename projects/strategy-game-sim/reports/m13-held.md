## M13: AoE4 overlay import/export: bring a community build in, take a tuned one out

**Outcome:** A build shared in the community overlay/guide format (AoE4_Overlay / RTS_Overlay, as used by aoe4guides) can be pasted into the simulator and run, and a build tuned here can be exported to that format for the in-game overlay. Import is partial by nature (villager-count and note steps map poorly to simulator actions), and the result says what was skipped.

### Exit criteria

Drafted 2026-11-21 from the BACKLOG item "AoE4 overlay/guide import and export" (discovery milestone 2026-11-20); confirmed by the owner when M13 starts. Left for later milestones: sim accuracy and gather rates, patch tracking, English tech gaps, spread of outcomes.

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M13.1 | Format mapping: a real RTS_Overlay/aoe4guides AoE4 export is fetched and checked in as a fixture, and `docs/aoe4-build-order-format.md` states the field mapping between it and the simulator's build format, including which overlay steps cannot map | code | | open |
| M13.2 | Import: pasting an overlay JSON build into the editor (and the API) produces a runnable simulator build; steps that cannot map are listed to the user, never silently dropped; unparseable input is reported as an error | code | | open |
| M13.3 | Export: a build can be exported to the overlay JSON format and re-imports to an equal build (round trip) for every step the format can express | code | | open |
| M13.4 | `docs/aoe4-build-order*.md`, `ARCHITECTURE.md` and `docs/api/openapi.json` describe the changes; Playwright covers importing a sample overlay build with a reported skip and exporting a build | code | | open |
| M13.5 | Owner checks the changes on the PR previews and then production | evidence | | open |

### Delivery sequence

1. Fetch a real export, write the mapping.
2. Import (parser, editor control, API).
3. Export and round trip.
4. Docs and acceptance specs.

### Safety and contracts

Import reads untrusted pasted JSON: bound its size and step count (S3/H1) and validate before the simulator sees it. The simulator's own build schema and results must not change; existing builds and saved links keep parsing.
