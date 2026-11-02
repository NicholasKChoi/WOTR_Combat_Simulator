# SGS-052 spec gate 1

Verdict: READY

Checks
1. Grounded: line-chart.tsx has the YAxis `insideLeft` label; results.tsx has the three testIds and yLabels (Units, Per minute, Resources); validate.ts bounds durationSeconds 60..3600; the spec file and `duration-seconds` testid exist. Pass.
2. Criteria testable (bounding-box intersection, fails on main, label text present, diff scoped). Pass.
3. Open questions: none; design leaves the method to the implementer.
4. Invariants: none adjacent (display only). Pass.
5. Contracts: no new names. SGS-048/049 both depend on SGS-052, matching "root" claim. Pass.
6. Size ~10 LOC, no deps. Pass.
7. Diagrams: not triggered. 8. Lessons: none recorded. 9. Decisions agree with M3.md Behavior row and Left to tickets. 10. On merge: none needed. 11. Risk low: UI styling only, no criticalPaths or strong triggers. 12. Docs: grep for insideLeft / Y-axis finds only design/M3.md (describes the bug, intentionally); ticket says to re-grep.

Notes (non-blocking)
- `start -> sheep` with default depletion: 15 sheep x 200 food = 3000 food, so floating food should pass 1000 well before 3600 s. The ticket already tells the implementer to confirm a tick >= 1000.
- The label overlap only occurs for the floating chart in practice; the other two charts' checks are guard checks.
