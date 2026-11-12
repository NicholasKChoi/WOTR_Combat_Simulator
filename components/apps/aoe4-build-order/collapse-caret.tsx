interface CollapseCaretProps {
    expanded: boolean
    name: string
    controlsId: string
    onToggle: () => void
    testId: string
}

export function CollapseCaret({ expanded, name, controlsId, onToggle, testId }: CollapseCaretProps) {
    return (
        <button
            type="button"
            data-testid={testId}
            className="btn btn-sm btn-outline-secondary"
            aria-expanded={expanded}
            aria-controls={controlsId}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${name}`}
            onClick={onToggle}
        >
            <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        </button>
    )
}
