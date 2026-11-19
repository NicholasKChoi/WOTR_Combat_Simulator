import cn from 'classnames'
import { type KeyboardEvent, type RefObject, useEffect, useRef, useState } from 'react'

import { SAVED_NAME_MAX_CHARS } from '../../../lib/aoe4-build-order/saved-builds'
import styles from './workbench.module.css'

export function validBuildName(name: string): boolean {
    const length = name.trim().length
    return length >= 1 && length <= SAVED_NAME_MAX_CHARS
}

const GROUP_NAMES = { 'save-copy': 'Save as copy', rename: 'Rename' } as const

interface NameFormProps {
    testIdPrefix: keyof typeof GROUP_NAMES
    label: string
    submitText: string
    initialName: string
    unchangedName?: string
    canSubmit: boolean
    onSubmit: (name: string) => void
    onCancel: () => void
    inputRef?: RefObject<HTMLInputElement | null>
}

export function NameForm({ testIdPrefix, label, submitText, initialName, unchangedName, canSubmit, onSubmit, onCancel, inputRef }: NameFormProps) {
    const [name, setName] = useState(initialName)
    const ownRef = useRef<HTMLInputElement>(null)
    const input = inputRef ?? ownRef
    const errorId = `${testIdPrefix}-name-error`
    const valid = validBuildName(name)
    const enabled = canSubmit && valid && name.trim() !== unchangedName

    useEffect(() => {
        input.current?.focus()
        input.current?.select()
    }, [input])

    function submit() {
        if (enabled) onSubmit(name.trim())
    }

    function onNameKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') return
        e.preventDefault()
        submit()
    }

    return (
        <div
            role="group"
            aria-label={GROUP_NAMES[testIdPrefix]}
            data-testid={`${testIdPrefix}-form`}
            className={styles.copyForm}
            onKeyDown={(e) => {
                if (e.key !== 'Escape') return
                e.preventDefault()
                onCancel()
            }}
        >
            <div className={styles.copyNameField}>
                <input
                    ref={input}
                    type="text"
                    data-testid={`${testIdPrefix}-name`}
                    aria-label={label}
                    className={cn('form-control', !valid && 'is-invalid')}
                    value={name}
                    aria-invalid={valid ? undefined : 'true'}
                    aria-describedby={valid ? undefined : errorId}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={onNameKey}
                />
                {valid ? null : (
                    <div id={errorId} data-testid={errorId} className="invalid-feedback">
                        {`Enter a name of 1 to ${SAVED_NAME_MAX_CHARS} characters.`}
                    </div>
                )}
            </div>
            <button type="button" data-testid={`${testIdPrefix}-submit`} className="btn btn-primary" disabled={!enabled} onClick={submit}>
                {submitText}
            </button>
            <button type="button" data-testid={`${testIdPrefix}-cancel`} className="btn btn-outline-secondary" onClick={onCancel}>
                Cancel
            </button>
        </div>
    )
}
