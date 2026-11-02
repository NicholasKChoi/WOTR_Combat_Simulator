import cn from 'classnames'

import styles from './workbench.module.css'
import { lineCount } from './text-lines'

interface BuildTextEditorProps {
    text: string
    onChange: (text: string) => void
}

export function BuildTextEditor({ text, onChange }: BuildTextEditorProps) {
    const lines = lineCount(text)
    return (
        <div className="mb-3">
            <label htmlFor="build-order-text">Build order</label>
            <div className={styles.editor}>
                <ol data-testid="build-order-gutter" aria-hidden="true" className={styles.gutter}>
                    {Array.from({ length: lines }, (_, i) => (
                        <li key={i} data-testid="build-order-line-number" data-line={i + 1}>
                            {i + 1}
                        </li>
                    ))}
                </ol>
                <textarea
                    id="build-order-text"
                    data-testid="build-order-text"
                    className={cn('form-control font-monospace', styles.textarea)}
                    rows={Math.max(8, lines)}
                    wrap="off"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    )
}
