# SGS-108 ticket re-spec 2 (written by manager from the agent's returned text)

- Scope 1 cites design Contracts: StepKindLegend(props: { testId?: string }), annotationToneClass(run, stale) returning styles.warn, styles.stale or '' (warn first), new StepTimes(props: { run: StepRun }). "per the design contract" wording removed. step-annotation.module.css keys named warn and stale.
- StepTimes exported, renders step-started and step-finished; StepRunCell renders through it, no behavior change, test ids unchanged. SGS-110 makes no StepRunCell change.
- annotationToneClass criterion (respec 2) compares against styles.warn / styles.stale after asserting both are non-empty and differ.
- New (respec 2) StepTimes criterion: renders for completed and in-progress runs; StepRunCell shows the same elements and texts.
- Re-spec 2 section appended. ticket-lint passes. No open questions, no diagrams.
- Note: SGS-110 still has conditional StepTimes extraction wording (Scope ~line 33, Out of scope line 47) to reword.
