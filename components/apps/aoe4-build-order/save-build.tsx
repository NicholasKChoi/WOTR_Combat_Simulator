import cn from 'classnames'
import { useEffect, useRef, useState } from 'react'

import type { SaveBuildResponse } from '../../../lib/aoe4-build-order/saved-builds'
import type { TextToBuildResult } from '../../../lib/aoe4-build-order/text-to-build'
import { type AutoRunStatus, type LiveInput, sameInput } from './auto-run'
import type { LibraryEntry } from './build-library'
import { savedBuildName } from './pin-name'
import { postSavedBuild } from './save-build-client'
import styles from './workbench.module.css'

interface SaveBuildProps {
    status: AutoRunStatus
    settled: LiveInput
    conversion: TextToBuildResult
    entries: LibraryEntry[]
    busy: boolean
    onSaved: (response: SaveBuildResponse, input: LiveInput) => void
}

type CopyState = 'idle' | 'copied' | 'failed'

export function SaveBuild({ status, settled, conversion, entries, busy, onSaved }: SaveBuildProps) {
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState<{ link: string; input: LiveInput } | null>(null)
    const [error, setError] = useState<{ message: string; input: LiveInput } | null>(null)
    const [copy, setCopy] = useState<CopyState>('idle')
    const settledNow = useRef(settled)
    settledNow.current = settled
    const mounted = useRef(true)
    const abort = useRef<AbortController | null>(null)
    const saveButton = useRef<HTMLButtonElement>(null)
    const linkInput = useRef<HTMLInputElement>(null)

    useEffect(
        () => () => {
            mounted.current = false
            abort.current?.abort()
        },
        [],
    )

    const linkVisible = saved !== null && sameInput(saved.input, settled)
    const errorVisible = error !== null && sameInput(error.input, settled)

    useEffect(() => {
        if (saved !== null && !linkVisible) {
            setSaved(null)
            setCopy('idle')
        }
        if (error !== null && !errorVisible) setError(null)
    }, [saved, linkVisible, error, errorVisible])

    useEffect(() => {
        linkInput.current?.focus()
        linkInput.current?.select()
    }, [saved])

    async function save() {
        if (status !== 'current' || !conversion.ok) return
        const input = settled
        const controller = new AbortController()
        abort.current = controller
        setSaving(true)
        const outcome = await postSavedBuild(
            { buildOrder: { ...conversion.order, name: savedBuildName(entries, input.text, input.selected) }, durationSeconds: Number(input.duration) },
            controller.signal,
        )
        if (!mounted.current) return
        setSaving(false)
        if (!sameInput(input, settledNow.current)) return
        if (!outcome.ok) {
            setSaved(null)
            setCopy('idle')
            setError({ message: outcome.message, input })
            return
        }
        setError(null)
        setCopy('idle')
        setSaved({ link: window.location.origin + outcome.response.path, input })
        onSaved(outcome.response, input)
    }

    async function copyLink() {
        if (saved === null) return
        try {
            await navigator.clipboard.writeText(saved.link)
            setCopy('copied')
        } catch {
            setCopy('failed')
            linkInput.current?.focus()
            linkInput.current?.select()
        }
    }

    return (
        <>
            <button
                ref={saveButton}
                type="button"
                data-testid="save-build"
                className={cn('btn btn-outline-primary', styles.saveButton)}
                disabled={status !== 'current' || busy || saving}
                aria-busy={busy ? 'true' : undefined}
                onClick={save}
            >
                Save build
            </button>
            {saved !== null && linkVisible ? (
                <div
                    className={styles.linkPanel}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') return
                        e.preventDefault()
                        setSaved(null)
                        setCopy('idle')
                        saveButton.current?.focus()
                    }}
                >
                    <input
                        ref={linkInput}
                        type="text"
                        readOnly
                        data-testid="saved-build-link"
                        aria-label="Link to this saved build"
                        className={cn('form-control', styles.linkInput)}
                        value={saved.link}
                    />
                    <button type="button" data-testid="copy-saved-link" className="btn btn-outline-secondary" onClick={copyLink}>
                        {copy === 'copied' ? 'Copied' : 'Copy link'}
                    </button>
                    {copy === 'failed' ? (
                        <p data-testid="copy-saved-link-hint" className={styles.linkHint}>
                            Could not copy. Select the link and copy it by hand.
                        </p>
                    ) : null}
                </div>
            ) : null}
            {error !== null && errorVisible ? (
                <p data-testid="save-build-error" role="alert" className={cn('text-danger', styles.saveError)}>
                    {error.message}
                </p>
            ) : null}
        </>
    )
}
