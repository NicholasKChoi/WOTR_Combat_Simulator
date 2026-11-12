# SGS-132 spec gate 3

Verdict: READY

Read: the re-spec 2 ticket and the gate-2 report. Code and design were checked in gate 2 and the re-spec changed only the status property wording, so I did not re-read them.

## Gate-2 gap: closed

- Scope `save-status` bullet now says the status is empty whenever the link is absent or a save is in flight, and non-empty whenever the link is shown and no save is in flight. It also says the link stays shown, with an empty status, during an in-flight second save, and that the link is not hidden while saving.
- Acceptance criterion 4 states the same property (visible and not in flight implies non-empty; absent implies empty; in-flight second save keeps the link and empties the status). It is checked in one polled assertion or one `page.evaluate`, so it cannot flake on the in-flight window.
- Both agree with each other and with the `saveStatusText` criterion (empty while saving). No new contradiction found. No design change needed.

## New gaps

None.

## Notes

- Criterion 1 requires "a test fails if the settled-input check or the saving check is removed". That implies table rows for each branch, as the ticket already describes.
- The in-flight second-save check needs a held (delayed) route reply to observe the window; the implementer will have to stub it with a deferred fulfill. This is not blocking.
