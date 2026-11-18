import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import cn from 'classnames'

import annotationStyles from './step-annotation.module.css'
import { StepKindLegend } from './step-annotation'
import styles from './page-help.module.css'

const TITLE = 'How this page works'
const FOCUSABLE = 'button, [tabindex]:not([tabindex="-1"])'

// Chromium's native modal Tab order passes through the browser UI (document.body) between the last and first
// stop, so the wrap is made here to keep focus on the dialog's own elements.
function wrapTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const stops = event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)
    const edge = event.shiftKey ? stops[0] : stops[stops.length - 1]
    if (document.activeElement !== edge) return
    event.preventDefault()
    ;(event.shiftKey ? stops[stops.length - 1] : stops[0]).focus()
}

function HelpSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section data-testid="help-section" aria-labelledby={id} className={styles.section}>
            <h3 id={id} className="h5">
                {title}
            </h3>
            {children}
        </section>
    )
}

function outsideRect(event: MouseEvent<HTMLElement>): boolean {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
}

export function PageHelp() {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    function open() {
        dialogRef.current?.showModal()
        if (contentRef.current !== null) contentRef.current.scrollTop = 0
    }

    return (
        <>
            <button type="button" data-testid="help-open" aria-haspopup="dialog" className="btn btn-outline-secondary btn-sm" onClick={open}>
                {TITLE}
            </button>
            <dialog
                ref={dialogRef}
                data-testid="help-modal"
                aria-labelledby="help-title"
                className={styles.dialog}
                onKeyDown={wrapTab}
                onClick={(event) => {
                    if (event.target === event.currentTarget && outsideRect(event)) event.currentTarget.close()
                }}
            >
                <button type="button" data-testid="help-close" className={cn('btn-close', styles.close)} aria-label="Close" onClick={() => dialogRef.current?.close()} />
                <h2 id="help-title" className="h4">
                    {TITLE}
                </h2>
                <div ref={contentRef} data-testid="help-content" className={styles.content} tabIndex={0}>
                    <HelpSection id="help-columns" title="The two columns and the run bar">
                        <p>
                            The run bar across the top picks a build, sets the run length in seconds and saves it. The page re-runs the simulation shortly after
                            you stop editing, so there is no run button; the run status at the end of the bar says whether the results are current. Below the bar,
                            the left column holds the build and the right column holds its results, and each scrolls on its own.
                        </p>
                    </HelpSection>
                    <HelpSection id="help-editors" title="The two editor views">
                        <p>
                            The Text view is the build as plain text, one step per line. After a run, a gutter beside the text shows each step line&apos;s kind
                            colour and its started and finished times; hover it, or put the caret on the line, for the time the step waited and what it waited
                            for. The Table view lists the same steps as rows you edit with controls, with a run cell at the start of each row.
                        </p>
                    </HelpSection>
                    <HelpSection id="help-kinds" title="Step kinds">
                        <p>The coloured edge of a run cell or gutter annotation tells the kind of step.</p>
                        <StepKindLegend />
                    </HelpSection>
                    <HelpSection id="help-tint" title="The yellow tint and what Blocked by lists">
                        <p>
                            <span data-testid="help-warn-tint" className={cn(annotationStyles.warn, styles.swatch)} /> A yellow run cell or annotation means the
                            step is still waiting, was never reached, or waited 60 s or longer.
                        </p>
                        <p>
                            Blocked by lists each wait the step had, with its time. For a step that is still waiting, it ends with still waiting for and what the
                            step is waiting for. A step the run never reached shows not reached, followed by the cause.
                        </p>
                    </HelpSection>
                    <HelpSection id="help-charts" title="Charts">
                        <p>
                            The Series list under each chart switches its lines on and off. A dashed line belongs to the pinned build. The Markers list switches
                            each kind of marker on and off for every chart at once.
                        </p>
                        <p>
                            The Units chart draws one unit line for each kind of unit. An upgrade dot on a unit line marks when an upgrade lands: a filled upgrade
                            dot belongs to the current run and a dashed ring belongs to the pinned run.
                        </p>
                        <p>
                            Drag across a chart to zoom to that stretch of the game, and Shift and drag to pan. While a chart is zoomed, Show earlier and Show later
                            pan it, and Reset zoom returns to the whole game. Each chart zooms on its own.
                        </p>
                        <p>
                            The Reorder chart handle moves a chart up or down with the mouse or the arrow keys. The Collapse chart caret hides a chart, and the
                            Expand chart caret shows it again.
                        </p>
                    </HelpSection>
                    <HelpSection id="help-pin" title="Pin and compare">
                        <p>
                            Pin the shown run to keep it while you edit. The charts then draw it dashed beside the current run, and the key results table lists
                            both runs with the difference. Unpin removes it. The pinned run is remembered in this browser.
                        </p>
                    </HelpSection>
                    <HelpSection id="help-save" title="Save and links">
                        <p>
                            Save as copy stores the shown build under a name in My builds and gives a link you can copy and share. Save a new version replaces one
                            of your own saved builds. Opening a link loads that build; choosing a template or one of My builds loads it in place.
                        </p>
                    </HelpSection>
                </div>
            </dialog>
        </>
    )
}
