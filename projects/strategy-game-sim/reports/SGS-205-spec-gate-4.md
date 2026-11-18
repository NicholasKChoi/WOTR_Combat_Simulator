# SGS-205 spec gate (report 4)

Verdict: READY

Checked at origin/main. Ticket: tickets/SGS-205-help-modal-headings-larger-than-body.md (re-spec 1)

## Gap from report 2: closed

Criterion 2 now has the regression spec measure a chart title's computed font size on the same page and assert each help section heading equals it. A section size other than the chart title's fails it. It fails at the base (`h6` 18px vs `h5` 22.5px). Bootstrap-classes-only rule is in Scope, not a criterion.

## Verified

- Scope: `HelpSection` renders `<h3 id={id} className="h6">`; `help-title` is `h2.h4`; `ChartHeaderRow` renders `<h3 className="h5">` (chart-header.tsx:53); `page-help.module.css` has no font rules; `styles/global.css` sets font-size 18px. All as stated.
- Criteria 1 and 2 hold together in the end state: section headings at `h5` (22.5px) are above the 18px body and below the title (`h4`, 27px at the 1200px floor).
- Existing tests: nothing pins the section heading class; the only `h6` pin is the chart-legend list headings, which stay.
- Unverified assumptions lists the computed-style behavior and the spec exercises it. Risk `low` is right (no critical path). Invariants none; On merge `none`; size about 5 LOC plus a spec; no open questions; no docs made untrue; no overlap with other open tickets; no input validation.
- No criterion searches code or pins a stale number.

## Notes

- The chart title `h3` has no testid; the spec will select it by the `th[scope=rowgroup] h3` structure or add a locator in the spec. Implementer's choice, not blocking.
