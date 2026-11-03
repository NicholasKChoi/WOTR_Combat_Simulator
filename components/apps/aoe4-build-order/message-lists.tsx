import cn from 'classnames'

import type { ResultMessage } from './messages'
import styles from './results.module.css'

function MessageItems({ messages }: { messages: ResultMessage[] }) {
    return (
        <ul className={cn(styles.messages, 'mb-0')}>
            {messages.map((m, i) => (
                <li key={i} data-testid="simulation-message" data-severity={m.severity} data-code={m.code}>
                    {m.message}
                </li>
            ))}
        </ul>
    )
}

export function WarningMessages({ messages }: { messages: ResultMessage[] }) {
    if (messages.length === 0) return null
    return (
        <div data-testid="simulation-warnings" className="alert alert-warning">
            <MessageItems messages={messages} />
        </div>
    )
}

interface InfoMessagesProps {
    messages: ResultMessage[]
    expanded: boolean
    onToggle: () => void
}

export function InfoMessages({ messages, expanded, onToggle }: InfoMessagesProps) {
    if (messages.length === 0) return null
    const collapsedLabel = `Show ${messages.length} info ${messages.length === 1 ? 'message' : 'messages'}`
    return (
        <div data-testid="simulation-notes" className="alert alert-info">
            <button
                type="button"
                data-testid="simulation-notes-toggle"
                className="btn btn-link p-0"
                aria-expanded={expanded}
                onClick={onToggle}
            >
                {expanded ? 'Hide info messages' : collapsedLabel}
            </button>
            {expanded ? (
                <div data-testid="simulation-notes-list" className="mt-2">
                    <MessageItems messages={messages} />
                </div>
            ) : null}
        </div>
    )
}
