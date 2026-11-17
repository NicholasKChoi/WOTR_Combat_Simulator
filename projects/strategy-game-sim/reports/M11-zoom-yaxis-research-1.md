# M11 zoom y axis: board item draft (frame depth, not filed)

Sources: plans/M11-20261116.md:56 (design question 2), design/M11.md:263 (B-Z6), design/M11.md:116 (C10 `rowsInWindow`), design/M11.md:382 (y axis fits window rows; full-game range given up).

## Facts
- C10 `rowsInWindow` returns rows inside the window plus the last row before `from` and the first row after `to`, so lines reach both edges.
- B-Z6 says the y axis "fits those rows", so the literal reading counts the two edge rows.
- Visible effect of A: a value just outside the window (e.g. wood floating just before a spend) can stretch the axis a little beyond what the zoomed lines show. Visible effect of B: tighter axis, but a line leaving the window toward a higher or lower edge value is cut off at the plot box edge, or the axis jumps as the window pans across a row boundary.
- Planner default if unanswered: A. Unverified: how large the stretch is on real builds (no measurement taken at frame depth).

## board.py add field values

question: While zoomed, should the y axis also count the data just outside the window? A: yes, the axis may show slightly larger values than visible

kind: decision

blocks: M11

options: A) Count the two edge rows: axis may reach a little past what the window shows, lines run cleanly to the edges | B) Only rows inside the window: tighter axis, but lines may be cut off at the edges or the axis jumps as you pan

recommendation: A: it is the design as written and keeps the axis steady while panning

research: reports/M11-zoom-yaxis-research-1.md

body lines:
- You decide this because it is a look-and-feel tradeoff in the zoomed charts; the zoom work (M11) waits on it, and the planner will pick A if you do not answer.
- Zoom lines run to both edges of the window by drawing one extra data point just before and just after it.
- A (recommended): those two extra points also set the vertical scale. Example: wood floating just before a spend can make the top of the axis a bit higher than anything visible in the window.
- B: only points inside the window set the scale. The axis hugs the visible lines, but a line heading to an off-window value can be clipped at the edge, or the axis can jump as you pan across a point.
- Either way the effect is small; it also decides what the zoom test checks for the axis range.
