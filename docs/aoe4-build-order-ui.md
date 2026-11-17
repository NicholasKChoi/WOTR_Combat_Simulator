# AoE4 Build Order Simulator: page behavior

How the build order page behaves: its layout, the editor and step table, the charts, pinning and comparing
runs, and saving and opening builds, including the script and smoke-test routes to the same save. The
simulation rules are in the [model doc](aoe4-build-order.md), the build order input, the routes and the
result the page draws are in the [format doc](aoe4-build-order-format.md), and reviews judge simulation
behavior against the model doc. This doc is the reference for what the page does with a result.

## Page

The page is `/apps/aoe4-build-order`, made for a desktop viewport and supported from 1200 px wide. A run bar stays at the top of the viewport while the page scrolls, and it never takes more than 40% of the viewport height: when its content is taller, the bar scrolls inside itself. The page section turns off the browser's scroll anchoring, so a bar that shrinks does not move the page. The page only scrolls above the columns, so the bar stays stuck only as far as the page still scrolls. It
holds the build select (labelled Build, see below), the `durationSeconds` number input (default 1200), a text/table toggle,
a save panel (`save-panel`) on its own row, with the save buttons, Save a new version and Save as copy, and the save status (see below), and the run status (`auto-run-status`), which comes last. There is no run button: the page re-runs the simulation on edit. Below the bar, Build and Results sit side by side in two equal columns, always both shown, with no tabs. The two columns fill the viewport below the run bar and each scrolls on its own, so the page does not scroll to reach either column's content. The Tab order follows the DOM order: the run bar's controls, then the Build column, then the Results column, with no positive `tabindex` anywhere and no arrow-key handling in the workbench; within the save row the order is the buttons, the status, the link, then Copy link. The Build column and the Results column carry the headings `Build order` and `Results` at the same size; the text editor's textarea takes its accessible name from the `Build order` heading. The Text and Table buttons are never disabled by the Results column. The step table wraps to fit the Build panel's column, a table that still cannot fit scrolls inside its own box (`step-table-scroll`), and the Build panel itself never scrolls sideways. Resizing the viewport across 1200 px changes nothing but the sideways scroll described below: no panel is remounted and no run starts, so editor focus and text, an uncommitted table cell and the chart state carry across it. The server render is the same two-column layout, so the first paint is the layout the page keeps.

Below 1200 px, including a phone or a browser zoom that makes the CSS viewport less than 1200 px wide, the page section is as wide as it is at 1200 px and holds the same two columns, and the document scrolls sideways; vertical behavior is unchanged and no notice is shown. The `Layout` container stays centered at its own max-width, so the section starts inside the viewport and overflows to the right of the container rather than starting at the page edge, and the `Layout` header stays as wide as the viewport.

The Build panel shows one editor view
at a time: the text view is a textarea with a line number beside each line that grows to its text (at least 8
rows) and does not scroll vertically itself (the Build column scrolls vertically; a line longer than the box scrolls sideways; filling the text from the select, a load or the table starts it scrolled to the left, while typing keeps the caret's scroll), and the table view is the
step table. After a result, the text view also shows an annotation for each step line in a second gutter between the line numbers and the textarea: the step's kind colour as a left border and its started and finished times without labels (the finished time is hidden in the gutter, and the step table and its run cells still show it), dimmed in the same stale state as the step table; hovering the annotation, or putting the caret on its step line, shows a popover at once (not a delayed browser title) with the time it waited and what blocked it, and for a `waiting` or `not-reached` step it reads `Still waiting. Blocked by: ...` instead of a time; the popover is drawn outside the narrow annotation column, stays inside the viewport and ignores the pointer, and the gutter lines stay unfocusable. Blank, comment, `start` and unparseable lines have an empty annotation. The text view is compact at every width: the gutter, annotations and textarea use a 0.875rem font, the annotation column is narrower and the gutter, annotation and textarea padding is tightened, so more of each line shows. Hovering a gutter annotation, or putting the caret on a step line, shades that step's span on the charts as a table row does; the last of the two inputs wins, so leaving a hovered annotation clears the shading and the popover until the next caret move, and blurring the textarea clears both. The kind legend renders above the text editor as well as above the step table, while a result is shown and the text has at least one parsed step, including when another line has a syntax error. The view survives runs but not a reload.
The select groups its entries as My builds (the builds this browser saved, newest first), Opened links (builds opened
by a `?n=` or `?b=` link, in the order they were opened; a shared build reads `<name> (shared)` and a `?b=` build
`<name> (<id>)`) and Templates (the shipped builds); an empty group is not shown. Choosing a template replaces the
text with its paste text and keeps the duration; choosing an opened `?b=` build restores its text and duration;
choosing one of My builds or a shared build fetches its latest version, and the select, duration, text editor, step
table and the save buttons are disabled while it loads, with no run until it ends. A failed fetch keeps the text,
duration and selection and shows `That build was not found. The current build is unchanged.` or `That build could
not be loaded. The current build is unchanged.`; the next choice clears it.
While the live text, or an opened build's duration, differs from the selected entry's loaded version (a template's
duration never counts), the selected option reads `<label> (edited)` and the select has `data-edited="true"`
(otherwise `"false"`); the marker follows typing, not the 500 ms pause. Choosing another entry while edited asks
`Discard your edits to "<label>"?`, and cancelling keeps the text, the duration and the selection. Reloading or
closing an edited page asks the browser to confirm; an unedited page leaves without asking.

The input settles 500 ms (`AUTO_RUN_DEBOUNCE_MS`) after the last edit to the text, the step table or the duration,
and the page then re-runs it; Enter in the duration field and choosing a build in the select settle the input at once.
On load the default build settles and runs once; with a `?n=` or `?b=` link the opened build runs instead, once its load ends (the default build runs if the load fails). A settled input is converted with `textToBuildOrder` and the
English catalog, and the checked `buildOrder` and `inputs.durationSeconds` are posted to the route only when the
input is valid and differs from both the shown result's input and the one in flight; a newer request aborts the
one in flight, and only the newest response is shown. The duration is checked in the browser: an empty field reads
`Duration is required.` and anything but a whole number from 60 to 3600 reads
`Duration must be a whole number of seconds from 60 to 3600.` (`duration-error`, with `aria-invalid` and
`aria-describedby` on the field). The status reads `Loading the build.` before the first run,
`Computing the simulation.` while a run with no result yet is in flight, `Updating the results.` while a newer
run is in flight, nothing while the shown result matches the input, `The simulation failed.` after a failure, and
for an invalid or rejected input `The charts show the last valid build.` when there is a result and
`No valid build to simulate yet.` when there is none. An invalid, rejected (400) or failed input keeps the last
good result on Results, dimmed (see the dimming rule below), with the issues or the error beside the editor; a failure adds a `Try again`
button (`simulation-retry`) that sends the same request again. The pin name is that of the shown result's input.

The issues list under the open editor view tracks the settled input at all times: parse issues (and the length
cap) and check issues show for every settled text. While any line fails to parse, the field and per-step issues of the lines that did
parse are listed with the syntax issues at once, in line order with line-less issues first. Otherwise the list is
in check order. It adds `Did you mean <id>?` after the message where an issue
has a near match, and marks each issue's line in the gutter. An edit never clears a shown result. The list starts
with `Fix N issues to run the simulation.` (`Fix 1 issue to run the simulation.` for one), counting the settled
issues. Server 400 issues take its place under the editor view, without lines, until a settled input changes the request.
Gold run-outs and other info notes are in the collapsed info list in Results.

The charts are the only column at every width and take the full Results width.

The page keeps one `text` state, and the step table is a view of it. The table renders
`parseBuildOrderText(text)`: one row per step with a trigger kind select and its fields, an action select and
the fields of that action under readable labels (Building, Rally to, Walk time (s), ...), a reaction checkbox
while the trigger is `depleted`, and icon buttons to move the row up or down or delete it, plus an add
button that appends `produce villager from <first villager producer>`. A field the step may omit (`instance`,
`count`, `rally`, `walkSeconds`, `builders`, `then`, `at`, depending on the action) sits behind a per-row More
control. The page keeps one open flag per step row, so the flags outlive the table:

- A row with no flag yet starts open where the step sets one of those fields.
- Moving a row swaps the two rows' flags.
- Deleting a row removes its flag.
- An added row starts closed.
- An edit that changes a row's action closes that row.
- Any other table edit leaves every flag alone, so a row the user opened stays open while its value is cleared.
- After an edit made in the textarea or by picking a prebuilt build, the page keeps one flag per parsed step: a
  row stays open if it was open or its step now sets one of those fields, and flags past the last step are
  dropped.
- Text that does not parse leaves the flags unchanged.
- The table is mounted only in Table view and only while the text parses, but the flags survive switching
  between Text and Table, and the text going unparseable and back.

The first row edits `start`: the rally node, one villager
count and node per pair (a node used by another pair is not offered), add and delete for pairs, and a
Customize button that inserts the civ's default `start` while the order has none; the table does not check
that the counts sum to the civ's total, and the issues list reports that. Every row, the start row included, is a table row with its labels inline and wrapping. An edit builds the new order
and sets `text` to `formatBuildOrderText(order)`, so a table edit drops comments and blank lines and keeps
`start`; typing in the textarea never rewrites the text. While the text does not parse, the table view shows
a notice (`step-table-unavailable`) holding the first parse issue's message instead of the table, and the
toggle stays usable. Id selects list the English data's choices (a unit select lists what the row's producer can make, a
research `at` select lists the buildings that research the tech); a pasted id the choices do not list shows as
an extra selected `<id> (unknown)` choice that the table leaves alone, and the issues list reports it under
the editor view. Number fields take unsigned integers (`move` count also takes `all`, and the trigger time is
whole seconds); clearing an optional number field omits it, while an empty or invalid entry in a required
field leaves the step as it was. Bounds are checked when the input settles, not in the table. An edit while a run
is in flight keeps the shown result until a newer run lands.

Once a result is shown, the table view adds a run cell as the first cell of every step row, and a legend of the step kinds
(`step-kind-legend`) above the table (the text view shows the same legend above its editor). The cell has a left border in the step's kind colour (age up, research, military,
villager, building, economy; any other step has a border with no colour and no badge), a kind badge, and, when the step
lines up with a step of the shown run, its started and finished times (`m:ss`, `ongoing` for a step still under way, an
en dash for one that never started), the time it waited and what blocked it. The cell labels the three times Started, Finished and Waited; a `waiting` or `not-reached` step has no Waited label and reads `still waiting` in place of a time. A step that waited on
resources, villagers, population or a prerequisite lists each cause with a non-zero time as `<cause> <m:ss>`, in that order, joined with `, `; a `waiting` step adds
`still waiting on <cause>`, and a `not-reached` step reads `not reached (<cause>)`. A cell whose step is `waiting` or `not-reached`,
or waited 60 s or longer, has a warning background. The start row has an empty first cell. Steps line up by their
canonical text (`formatBuildStep`): the longest common run of identical steps at the top of the build and then at the
bottom match the shown run's steps, and every step between them has no times. Editing one step leaves the other steps their
times; choosing another build in the select, or opening one, leaves no step any times. A step with no times still shows its kind. The kind comes from the step alone: a `build` of a landmark is Age up (so a landmark of a later age than the current one still reads Age up), any other `build` is Building, a `research` is Research, a `produce` of a villager is Villager and of any other unit is Military, and a `move`, `rally` or `pause` is Economy; the colours are blue for age up, cyan for research, red for military, green for villager, grey for building and light grey for economy. The kind colour is independent of the warning background.

A 200 draws four line charts, each with a series legend titled "Series" (one toggle button per series):

| chart | series keys | series names |
|---|---|---|
| Units produced (Units view) | each `unitsProduced` `baseId`, in order of first appearance (one line per unit line, every tier summed) | the entry's `lineName` |
| Gather rates (Rate view) | `food`, `wood`, `gold`, `stone` | `Food`, `Wood`, `Gold`, `Stone` |
| Gathered resources | `food`, `wood`, `gold`, `stone` | `Food`, `Wood`, `Gold`, `Stone` |
| Floating resources | `food`, `wood`, `gold`, `stone` | `Food`, `Wood`, `Gold`, `Stone` |

The table lists each chart's default view. Gather rates and Units produced each have a two-option view toggle
(`chart-view-toggle`, buttons `chart-view-option` with `aria-pressed`); the other two charts have none. Gather rates offers
Rate (the default, `gatherRates`, y axis label `Per minute`) and Villagers (`gatherers`, keys and names as the resource rows, y axis
label `Villagers`). Units produced offers Units (the default, y axis label `Count`) and Buildings (each `productionBuildings`
entry, key `baseId`, name `name`, in result order, y axis label `Buildings`). The choice is not stored and resets on reload. The
pinned run follows the view, drawn from its own `gatherers` or `productionBuildings` (matched to the current lines by key); a building
only the pinned run has gets only a dashed line.
In the Buildings view each line is drawn at or a small amount above its true count (a different amount per visible building, none for the first, the same at every time, always below half a building), so buildings with equal counts do not draw on top of each other; the y axis shows whole numbers only and the tooltip shows each building's true count. A pinned building's line is drawn at the same offset as the current line with its key, and a building hidden in the legend takes no offset.

Each series' line carries its key as `data-series` (a pinned run's line carries `pinned:<key>`). Clicking a legend item hides that series (the item is dimmed) and clicking
it again restores it; the legend has one item per series, named without a suffix: with a pinned run, an item for a series in both runs hides and restores both its lines, and a series only the pinned run has is listed once, with a dashed swatch. The tooltip lists only the current run's series; pinned lines and markers are not in it. Each chart also draws the result's `markers` as solid vertical lines in their kind colour. By default only `age-up` markers carry a
text label `<label> <m:ss>` (for example `Castle 13:24`) above the plot, stacked in rows by their measured width so each stays
readable. A marker without a text label stays a line and shows `<label> <m:ss>` as a hover title. Tooltip values are shown rounded to
at most 1 decimal place. One marker control titled "Markers", above the charts and shared by all of them, lists one entry per
kind present, each a button: hovering or focusing it labels that kind's markers on every chart in place of the age-up labels (the age-up labels
return when no entry is hovered or focused, and a hovered entry wins over a focused one). Clicking an entry, or pressing Enter or Space on it,
hides that kind's lines and labels on every chart (the entry is dimmed and `aria-pressed` is `"false"`) and clicking again restores them; a hovered or focused hidden kind labels nothing and the age-up labels show instead. The hidden kinds are not stored: they survive a new run, collapsing and reordering, and reset on reload. Entries are: `Age-up` (`#b8860b`), `Economy` (`#008080`), `Unit tier` (`#c43bb0`), `Blacksmith` (`#5f7d8c`)
and `Other` (`#6b6bd6`). A run with no markers draws neither lines nor the marker control. Clicking a series
legend item does not hide markers. The pinned run's `age-up` markers (no other kind) are drawn as dashed `6 4`
vertical lines in the age-up colour without text labels (hover title `<age> (pinned) <m:ss>`); hiding the `age-up` kind in the marker control hides them too, unless the current run has no age-up marker. The marker control lists only the
current run's kinds. A chart that draws at least one pinned line or pinned marker has one entry `dashed = pinned build`
(`chart-pinned-legend`) after the series legend; hiding every pinned line through the series legend removes it unless a pinned
age-up marker is drawn, and showing a series restores it. Messages come from `warnings` and `notes`, `warnings` entries first.
Those of severity `warning` appear in a warnings list. Those of severity `info` sit behind a toggle reading
"Show N info messages" ("Show 1 info message" for one); clicking it lists them and the toggle reads
"Hide info messages". The toggle starts collapsed on page load and keeps its state across later runs. Each
message shows its `message` text only. Messages of severity `debug` are not shown, and the page has no control to show them. With no message of a severity there is no list for it.

Chart controls: each chart's title row holds, in order, a drag handle (`chart-drag-handle`, a grip button labelled
"Reorder <title> chart"), the title, a collapse caret (`chart-collapse`) and, on Gather rates and Units produced, the view toggle.
Collapsing a chart hides everything under the title row (the series legend and the plot); the handle, the
title, the caret and the view toggle stay visible and usable. The hidden series, the chosen view and the
pinned run survive a collapse and a move, and a collapsed chart draws no step band, markers or pinned lines while the others keep
theirs. The caret flips between "Collapse <title> chart" and "Expand <title> chart", is toggled by click, Enter or Space, and
keeps focus. A chart is reordered by dragging its handle with the primary mouse button, or with ArrowUp and ArrowDown while the
handle is focused; other keys do nothing, and the arrow keys do nothing while a pointer drag is in progress (from pointer down until it ends). A drag starts after the pointer has moved 4px, leaves the order unchanged until the
drop, and drops the chart where the pointer's height places it among the other charts. Escape or a cancelled pointer ends the
drag with no change, and a touch drag that starts on the handle does not scroll the page. A collapsed chart reorders like an expanded one. After a
move that changes the order, the moved chart's handle has focus and a visually hidden status (`chart-order-status`) names the chart
and its new position out of four; ArrowUp on the first chart and ArrowDown on the last change nothing and announce nothing. A
visually hidden help text (`chart-reorder-help`) describes the handle's drag and arrow-key use. The default order is Units produced, Gather rates,
Gathered resources, Floating resources, all expanded. The layout is kept in `localStorage` under `aoe4-build-order.chart-layout`
as `{ version, order, collapsed }` and applied after the page loads, so the first paint is the default layout. `collapsed`
holds chart ids and, when the key results panel is collapsed, `key-results`; `order` holds chart ids only. A stored value
that is not valid JSON or has another version gives the default layout; unknown and duplicate ids are dropped and a missing id
is appended to the order. Loading the page writes nothing: with nothing stored the key stays unset until a chart or the key
results panel is moved or collapsed. When the store is unavailable or blocked, the layout lasts for the page session and no error is shown.

Key results panel: under the "Results" heading, a "Key results" title row (`compare-heading`) holds a collapse caret
(`compare-collapse`), then "Pin this run" and "Unpin". Collapsing the panel hides the pinned label and the compare table; the title
row and both pin buttons stay. Its collapsed state is part of the chart layout above, so it survives a reload.

The step table, and the text view's gutter annotations, double as the annotated build order for the charts. Pointing at a row, or focusing a control in it, highlights the row and shades that step's span, from Started to Finished, on every chart; an in-progress step's span runs to the end of the run, a step that starts and finishes in the same second shows as one vertical line, and a waiting or not-reached step, or a row with no run times, shows no band. Pointing at or focusing the start row shades nothing. Moving off the row, or running again, clears the shading. Moving focus between controls of one row keeps it. While the result is stale, a row that still has its times still shades its span.

In the key results title row, "Pin this run" (`pin-run`, enabled while a result is shown, unless its text and
duration both equal the pinned run's) keeps the shown result as the pinned run, and "Unpin" (`unpin-run`, enabled while a run is
pinned) drops it. The pin stays through later runs, text and build edits, invalid, rejected and failed inputs, and a reload: the pin is kept in `localStorage` under
`aoe4-build-order.pinned-run` as the build text, duration and name (not the result), and the page re-runs it on
load. On that load:

- A stored value that is not valid is ignored and left in `localStorage` (the next Pin overwrites it).
- A text that no longer converts drops the pin.
- A response that is not ok (400 or 5xx) from the re-run drops the pin.
- Only a failed request (the network) keeps the stored pin, and no pin is shown.
- A Pin or Unpin made before the re-run finishes wins.

The label
`pinned-label` reads `Pinned: <name>, <m:ss>`. The name comes from the shown result's input: the name of the entry selected when that input was sent if its text equals the input exactly, else the name of the first entry whose text does (an opened build by its stored name, without the ` (<id>)` of its select label), else `<name> (edited)` for the selected entry,
and `Custom build` when no entry is selected.

The charts (`results-last-good`) and the step table's run cells dim together whenever the shown result no longer
describes the live input:

- Its text or its duration differs from the live text or duration. That includes the 500 ms before the input
  settles and while the page is `updating`.
- The page status is `invalid`, `rejected` or `failed`.
- A change to the select alone does not dim.

`results-last-good` carries `aria-describedby="auto-run-status"` only while it is dimmed and the status text is not
empty, so it is absent while an edit to a current result waits the 500 ms to settle.

With a pinned run, each chart also draws the pinned run's series dashed. A series whose key the current run also
has takes that current series' color; a series only the pinned run has takes the palette color at the index
(number of current series) + (its index among the pinned series); an index past the last palette color wraps
around to the start, so colors then repeat, as they do for current series. Each has the name `<name> (pinned)` and the key `pinned:<key>`. The x axis covers
the union of both runs' sample times; a series has a gap at times outside its own run. A pinned line is hidden and
restored together with its series' legend item.

With both a shown result and a pinned run, a compare table lists up to seven rows (`data-key`): military spent at
10, 15 and 20 minutes (`military-600`, `military-900`, `military-1200`; the cumulative `spent.military` at the
sample at that time), the Feudal, Castle and Imperial times (`age-2`, `age-3`, `age-4`; the `reachedAt` of that
age) and the time the population cap was reached (`pop-cap`). A row is omitted when both runs have no value for
it. A missing value reads `run ends at <m:ss>` (that run's duration) for a military time past the end of the run and
`not reached` for an age or the population cap that never happened. Each row shows the pinned value, the current
value and the delta (current minus pinned). Military deltas read `+120 resources` or `−120 resources`, time deltas
`0:35 earlier` or `0:35 later`, an equal pair `same`, and a delta with a missing value a dash. Each row carries
`data-direction` (`better`, `worse` or `same`; absent when a value is missing): more military is better and an
earlier time is better. A `better` delta is green and a `worse` delta red. When every row is omitted the table
is replaced by `compare-empty` reading "Nothing to compare yet". The table sits in a horizontally scrolling wrapper
(`compare-scroll`) and is hidden unless both runs exist.

A 400 shows every returned issue's `message` (each starts with the step or field it applies to, such as `steps[2]` or `inputs.durationSeconds`, or with `build order:` or `request:` for whole-body problems; the route never names a line) under the editor view and keeps any earlier result on Results, dimmed; that rejected request is not sent again. With no earlier result, Results shows its heading and the compare panel (the pin label and Unpin while a run is pinned, no compare table without a shown result).
When the body has `omittedIssues`, the list ends with one more item, "N more issues not shown." Any
other HTTP failure shows "The simulation could not be run (HTTP <status>)."; a request or response-body
error shows "The simulation could not be run. Please try again."

Prebuilt builds live in `data/aoe4-build-order/builds/`, one `BuildOrder` JSON file per build, each with a
`source`. Every prebuilt build is paste-representable: it re-parses from its own paste text to the same
`start` and `steps`. At default inputs, with depletion on, every prebuilt build meets this bar: at 1200 s and
at 3600 s no step is `waiting`, every non-reaction step has started, and a `not-reached` reaction has
`waitingOn: 'trigger'`; at both horizons every gold deposit that has run out has a `move all` reaction from it
whose `startedAt` is its `depletedAt`, and no gold warning has severity `warning`; and no `farm-idle` warning
appears at 1200 s, 1800 s or 3600 s. Each also meets its production floors and floating cap at 1200 s:
villager and unit counts and a food rate at least the build's row in
`lib/aoe4-build-order/production-floors.ts`, and each floating resource at most that file's cap. Each build
named with `1TC` has a `whenever gold runs out move all gold to gold#2` reaction as its first reaction.

The four prebuilt builds are `ENG 1TC`, `ENG Knight/Longbow (King's Palace)`, `ENG Spear/Longbow into
MAA/Crossbow` and `ENG 1TC Council Hall`.

## Saving a build and opening it by link

The run bar has two save buttons. Save as copy (`save-build-copy`) is shown for every entry, templates and opened
links included, and Save a new version (`save-build`) only for one of My builds whose edit secret this browser
holds. Both are enabled only while the shown result matches the settled input (status `current`), the input
converts, and no save and no build load is in flight; Save a new version also needs the build to be edited. A save
stores the parsed build order, not the raw text, and the duration, so comments and blank lines are not kept when
the build is opened elsewhere.

Save as copy opens a small form (`save-copy-form`) with the name (`save-copy-name`, labelled `Name of the copy`)
prefilled as `<name> (copy)`, cut to fit the name cap, where `<name>` is the selected entry's name, or `Custom
build` when no entry is selected. The trimmed name must be 1 to 100 characters; otherwise the field shows `Enter a
name of 1 to 100 characters.` (`save-copy-name-error`) and Save copy (`save-copy-submit`) is disabled. Enter in
the name or Save copy saves; Escape or Cancel (`save-copy-cancel`) closes the form and returns focus to Save as
copy. The form closes when the save starts, and choosing another entry closes it. Each copy is a new named build
with a new id, even for the same content. It becomes the newest of My builds and is selected, and the address gets
`n=<id>`; when the settled input changed while the save was in flight, the new build is only added to My builds.

Save a new version replaces the selected build with the shown text and duration, keeping its name, and the build
is no longer edited. A second tab or another browser that saved the build first makes the update fail with `This
build changed somewhere else. Choose it again to get the latest version, or save a copy.`, and Save a new version
stays disabled until the build is chosen again, which loads the latest version.

The create response carries the build's edit secret once. The page keeps it only in this browser's My builds list,
which holds the newest 50 builds: the 51st save evicts the oldest, which then opens read-only here, and its link
still works. The secret is sent only as the update's `Authorization` header, never in the address. When the
browser cannot store the list, the save still succeeds and the page says `This browser could not store the edit
key, so you can edit this build only until you close the page.` (`my-builds-unavailable`). While the browser can store
the list, a save in another tab, or another tab clearing the storage, updates this tab's My builds. After a save here, this tab's list also holds
at most 50 My builds: the new build goes first among them and the oldest in list order is dropped, never the
selected one. A stored list the page cannot read, or one with an unreadable entry, is never deleted
by reading it. Before the next save replaces it, the page copies the stored text to
`aoe4-build-order.my-builds.backup` unless that key already holds a copy; if the copy cannot be written, the save
does not replace the list.

The link is the page's origin plus `?n=<id>`. It is shown read-only (`saved-build-link`) with a Copy link button
(`copy-saved-link`) in the save row, and focus moves to the link with its text selected. Copy reads `Copied` once
the clipboard accepts the link; when the browser refuses it, the link stays selected and the page says `Could not
copy. Select the link and copy it by hand.` Escape with focus on the link or on Copy link hides the link and returns focus to the button that
saved, or to Save as copy when that button is disabled; Escape on a save button does nothing. The link, the save
status and any save error go away on the first settled change of the text, the duration or the selected build (not while the edit is still inside the pause). A save
answered after the settled input changed shows no link and no error. Opening the link anywhere but the browser that
made it opens the build read-only, as a shared build; Save as copy still works there.

The save panel's first child is the save row (`save-row`). In order it holds Save a new version (when shown), Save as
copy, the save status (`save-status`), and, while the link is shown, the link and Copy link. The Save as copy form, the
Copy hint, the storage warning and the save error sit below the row, in the panel, not in it. The row never wraps, at any width, and the link field shrinks to fit. The status element is always present and is announced politely (`role="status"`). It
reads `Saved` after Save as copy and `Saved version <revision>` after Save a new version, with the revision from the
response, and is empty while a save is in flight, after a failed save, and whenever the link is not shown. It stays
for as long as the link does, with no timer, so a second save replaces its text. A failed save also hides the link.

The page no longer creates `?b=` links. Links made by an earlier version of the page and by the `saveBuild` route
still open:

Opening `/apps/aoe4-build-order?b=<id>` loads that build into the editor and runs it: the select gains an option
`<name> (<id>)` under Opened links that is selected, the duration is the saved one, and the select, duration, text editor, step
table and the save buttons are disabled while the build loads, with no run until it ends. A successful `?n=` or `?b=` load selects nothing and scrolls nothing. `?n=<id>` opens a named build the same way: one of My builds keeps its stored name, any other loads as `<name>
(shared)` under Opened links. When both are present `n` wins and `b` is not fetched. The first `n` or `b` in the
address is the only one read, and a later change of either (back or forward) loads nothing. After a load or a
choice the address follows the selected entry: `n=<id>` for My builds and shared builds, `b=<id>` for an opened
`?b=` build, and neither for a template; other query keys are kept. A load that fails leaves the address as it was. For either key, an unknown or malformed id shows `That saved build was not found. Showing the
default build.`, and a load that failed shows `That saved build could not be loaded. Showing the default build.`;
either runs the default build. A saved build whose text no longer converts opens as text with its issues and does
not run.

A failed save shows one message (`save-build-error`): `This build changed somewhere else. Choose it again to get
the latest version, or save a copy.` for a conflict, `You cannot edit this build here. Save a copy instead.` when
the secret is refused, `This build no longer exists. Save a copy instead.` when the build is gone, the first issue
for a rejected build (`The build could not be saved: <issue>`), `The build is too large to save.`, `Saving is
unavailable right now. Try again later.`, or `The build could not be saved. Try again.` for any other failure.
When saves are limited it reads `Too many saves. Try again in <n> seconds.` below a minute and `Too many saves. Try
again in <m> minutes.` from a minute on (rounded up), or `Too many saves. Try again later.` when the wait is
unknown.

## Saving a build from a script

A script or an agent saves a build with `POST <origin>/api/aoe4-build-order/builds`, `Content-Type:
application/json` and the body `{ "buildOrder": <BuildOrder>, "durationSeconds": <integer> }`. `buildOrder` is the
same JSON the simulate route takes (a file under `data/aoe4-build-order/builds/` is a valid source), and
`durationSeconds` is an integer in the simulate route's bound (60 to 3600). The reply, as `docs/api/openapi.json`
documents it:

| status | meaning | what to do |
|---|---|---|
| 201 | created, body `{ id, path }` | print the link |
| 200 | the same content was already saved, body `{ id, path }` | print the link |
| 400 | rejected, body has `issues` | fix the build and send it again |
| 413 | the saved record is too large | shorten the build |
| 429 | too many saves from this client, `Retry-After` header | wait that many seconds, then send again |
| 500 | the build id could not be created | try again later |
| 503 | storage is unavailable | try again later |

The link to print is the deployment's origin plus `path` (`<origin><path>`). `path` is relative, so the script
adds the origin it posted to. The same content always returns the same link.

```bash
curl -sS -X POST http://localhost:3000/api/aoe4-build-order/builds \
  -H 'Content-Type: application/json' \
  -d "{\"buildOrder\": $(cat data/aoe4-build-order/builds/english-1tc.json), \"durationSeconds\": 1200}"
```

The same save in Node, which prints the link:

```bash
node -e "const o='http://localhost:3000',b=JSON.parse(require('fs').readFileSync('data/aoe4-build-order/builds/english-1tc.json','utf8'));fetch(o+'/api/aoe4-build-order/builds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({buildOrder:b,durationSeconds:1200})}).then(r=>r.json()).then(({path})=>console.log(new URL(path,o).href))"
```

A preview deployment that has Vercel protection on also needs the header `x-vercel-protection-bypass: <secret>`,
with the secret from the owner's "Protection Bypass for Automation" setting. Never print the secret.

## Checking a deployment with the smoke test

`npm run smoke:preview -- https://<preview-host>` checks a deployment end to end. One-time setup: run `npm run
acceptance:setup` (installs Chromium), enable "Protection Bypass for Automation" in the Vercel project settings,
which creates `VERCEL_AUTOMATION_BYPASS_SECRET`, and export that variable in the shell. The script sends it as the
header `x-vercel-protection-bypass` to the deployment's origin only, and never prints it.

The run has four steps, in this order, and stops at the first failure:

1. `save`: posts `data/aoe4-build-order/builds/english-1tc.json` with a duration of 1200 s and expects 201 or 200 with a body whose `id` is a valid build id.
2. `read back`: reads the build by its id and expects the same `buildOrder` and `durationSeconds`.
3. `open`: opens `/apps/aoe4-build-order?b=<id>` in Chromium and expects the saved build selected, the run
   current and the units-produced chart visible.
4. `delete`: deletes the build and expects 204. It does not read the build again: GET is cached as immutable, so
   the CDN can still serve a deleted build.

Each step prints one line, `PASS <step>` or `FAIL <step>: <reason>`. The exit code is 0 when all four pass, 1 when a
step failed, and 2 for a usage error or a missing secret (the first save answered 401 or 403 while the variable was
unset). A redirect (a 3xx answer) from the deployment fails the step it occurs in for the API requests, which the script
does not follow. In `open`, with the secret set, a same-origin request carrying the secret header is not followed
either and a redirect fails the step, so the secret never goes to another host. With the secret unset no header is
added, `open` installs no route handler and the page follows redirects.
A run that fails after the save still deletes the build it saved. A second run saves the same content, so
it reuses the same link. Each run costs one save of the rate limit.

The script is for previews and local runs. Against production the delete is refused, the line is `FAIL production
deployment: delete is disabled`, and the saved build stays.
