# M11 help-modal timing: drafted board item (not filed)

Depth: frame. Sources read: plans/M11-20261116.md (design question 1, row J, row K), design/M11.md (B-H6, C18).

Facts used
- Row J (help modal) has no dependencies and "can land any time"; every PR auto-merges to production (plans/M11-20261116.md row J, question 1).
- B-H6 section 4 describes the Blocked-by wait text (ticket E); section 5 describes the marker control (G), unit lines and upgrade dots (H), zoom/pan/reset (I2) (design/M11.md B-H6, line 323).
- Plan default: J describes the page as it is when written; K (docs ticket) brings sections 4 and 5 up to the end state and adds page-help.tsx and page-help.test.ts to K's files (plans/M11-20261116.md question 1).
- Option B would make J depend on E, H and I2, pushing it to the end of both chains (same line).
- Unverified: how long the gap between J and the last feature ticket would be in practice.

## board.py add field values

question: Help text for the page: describe features before they ship, or wait?
kind: decision
blocks: M11
options: A) Write the help for the page as it is when it lands: later features get added at the end, so it may be briefly incomplete | B) Land the help last: it describes the finished page, but you get no help button until the end
recommendation: A: nothing shipped ever mentions a missing feature, and help arrives early at the cost of one small follow-up edit

body lines:
Only you can weigh an early, partial help button against a late, complete one; the help modal ticket waits on this, and every change goes live to production as soon as it merges.
- The help text is designed to cover the marker control, the unit-line chart with upgrade dots, zoom/pan/reset, and the new "waiting for ..." wording. Those arrive in separate changes that may merge after the help button does.
- A) The help button ships early and covers only what is live then. The closing docs change adds the missing sections once those features are live (about 2 extra files in that change). Visitors never read about a feature that is not there.
- B) The help button ships after the wait-text, unit-line and zoom changes. Text is complete the first time, but the help button is the last thing to appear, and its start is tied to the two longest chains of work.
- Skipping text for unshipped features is not offered: describing a missing feature would mislead visitors on production.

### Answer
