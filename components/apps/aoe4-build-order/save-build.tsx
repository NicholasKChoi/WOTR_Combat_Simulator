import cn from 'classnames'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import type { CreateNamedBuildResponse, UpdateNamedBuildResponse } from '../../../lib/aoe4-build-order/named-builds'
import { SAVED_NAME_MAX_CHARS } from '../../../lib/aoe4-build-order/saved-builds'
import type { TextToBuildResult } from '../../../lib/aoe4-build-order/text-to-build'
import { type AutoRunStatus, type LiveInput, sameInput } from './auto-run'
import { browserStorage } from './browser-storage'
import { copyName, entryKey, type LibraryEntry } from './build-library'
import { type MyBuildEntry, myBuildsAvailable, upsertMyBuild } from './my-builds-storage'
import { createNamedBuild, type NamedSaveFailure, updateNamedBuild } from './named-build-client'
import styles from './workbench.module.css'

interface SaveBuildProps {
    status: AutoRunStatus
    settled: LiveInput
    conversion: TextToBuildResult
    busy: boolean
    entry: LibraryEntry | undefined
    editSecret: string | null
    edited: boolean
    onCreated: (response: CreateNamedBuildResponse, input: LiveInput, name: string) => void
    onUpdated: (response: UpdateNamedBuildResponse, input: LiveInput) => void
}

type CopyState = 'idle' | 'copied' | 'failed'
type Saver = 'copy' | 'version'
type SaveOutcome<R> = { ok: true; response: R } | NamedSaveFailure

interface Saved {
    link: string
    input: LiveInput
    by: Saver
}

interface Lock {
    key: string
    revision: number
}

const NAME_ERROR_ID = 'save-copy-name-error'
const UNSTORED_TEXT = 'This browser could not store the edit key, so you can edit this build only until you close the page.'

function validName(name: string): boolean {
    const length = name.trim().length
    return length >= 1 && length <= SAVED_NAME_MAX_CHARS
}

function remember(entry: MyBuildEntry): boolean {
    const storage = browserStorage()
    return storage !== null && myBuildsAvailable(storage) && upsertMyBuild(storage, entry).persisted
}

export function SaveBuild({ status, settled, conversion, busy, entry, editSecret, edited, onCreated, onUpdated }: SaveBuildProps) {
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<{ name: string; key: string | undefined } | null>(null)
    const [saved, setSaved] = useState<Saved | null>(null)
    const [error, setError] = useState<{ message: string; input: LiveInput } | null>(null)
    const [unstored, setUnstored] = useState<LiveInput | null>(null)
    const [lock, setLock] = useState<Lock | null>(null)
    const [copy, setCopy] = useState<CopyState>('idle')
    const settledNow = useRef(settled)
    const mounted = useRef(true)
    const abort = useRef<AbortController | null>(null)
    const versionButton = useRef<HTMLButtonElement>(null)
    const copyButton = useRef<HTMLButtonElement>(null)
    const nameInput = useRef<HTMLInputElement>(null)
    const linkInput = useRef<HTMLInputElement>(null)

    useEffect(
        () => () => {
            mounted.current = false
            abort.current?.abort()
        },
        [],
    )

    useEffect(() => {
        settledNow.current = settled
    }, [settled])

    const formOpen = form !== null && form.key === entry?.key
    const linkVisible = saved !== null && sameInput(saved.input, settled)
    const errorVisible = error !== null && sameInput(error.input, settled)
    const unstoredVisible = unstored !== null && sameInput(unstored, settled)
    const locked = lock !== null && entry !== undefined && lock.key === entry.key && lock.revision === entry.loaded?.revision

    useEffect(() => {
        if (saved !== null && !linkVisible) {
            setSaved(null)
            setCopy('idle')
        }
        if (error !== null && !errorVisible) setError(null)
        if (unstored !== null && !unstoredVisible) setUnstored(null)
        if (lock !== null && !locked) setLock(null)
        if (form !== null && !formOpen) setForm(null)
    }, [saved, linkVisible, error, errorVisible, unstored, unstoredVisible, lock, locked, form, formOpen])

    useEffect(() => {
        linkInput.current?.focus()
        linkInput.current?.select()
    }, [saved])

    useEffect(() => {
        if (!formOpen) return
        nameInput.current?.focus()
        nameInput.current?.select()
    }, [formOpen])

    const canSave = status === 'current' && conversion.ok && !busy && !saving
    const showVersion = entry?.kind === 'mine' && editSecret !== null
    const canSaveVersion = canSave && edited && !locked
    const nameOk = form !== null && validName(form.name)
    const canSubmit = canSave && nameOk

    // Resolves to the outcome and whether the settled input is still the one sent, or null when the
    // request was aborted or the panel unmounted, in which case nothing may change.
    async function send<R>(
        input: LiveInput,
        request: (signal: AbortSignal) => Promise<SaveOutcome<R>>,
    ): Promise<{ outcome: SaveOutcome<R>; current: boolean } | null> {
        const controller = new AbortController()
        abort.current = controller
        setSaving(true)
        setUnstored(null)
        const outcome = await request(controller.signal)
        if (!mounted.current || controller.signal.aborted) return null
        abort.current = null
        setSaving(false)
        return { outcome, current: sameInput(input, settledNow.current) }
    }

    function showSuccess(path: string, input: LiveInput, by: Saver, persisted: boolean, current: boolean) {
        if (current) {
            setError(null)
            setCopy('idle')
            setSaved({ link: window.location.origin + path, input, by })
        }
        if (!persisted) setUnstored(current ? input : settledNow.current)
    }

    function showFailure(failure: NamedSaveFailure, input: LiveInput, current: boolean) {
        if (!current) return
        setSaved(null)
        setCopy('idle')
        setError({ message: failure.message, input })
    }

    async function submitCopy() {
        if (!canSubmit || !conversion.ok || form === null || abort.current !== null) return
        const name = form.name.trim()
        const input = settled
        const order = { ...conversion.order, name }
        setForm(null)
        const sent = await send(input, (signal) => createNamedBuild({ buildOrder: order, durationSeconds: Number(input.duration) }, signal))
        if (sent === null) return
        const { outcome, current } = sent
        if (!outcome.ok) {
            showFailure(outcome, input, current)
            return
        }
        const { response } = outcome
        const persisted = remember({ id: response.id, name, editSecret: response.editSecret, revision: 1, updatedAt: response.updatedAt })
        showSuccess(response.path, { ...input, selected: entryKey.named(response.id) }, 'copy', persisted, current)
        onCreated(response, input, name)
    }

    async function saveVersion() {
        if (!canSaveVersion || !conversion.ok || entry?.kind !== 'mine' || entry.id === null || editSecret === null || abort.current !== null) return
        const revision = entry.loaded?.revision
        if (revision === undefined || revision === null) return
        const { id, key, name } = entry
        const input = settled
        const order = { ...conversion.order, name }
        const sent = await send(input, (signal) => updateNamedBuild(id, editSecret, revision, { buildOrder: order, durationSeconds: Number(input.duration) }, signal))
        if (sent === null) return
        const { outcome, current } = sent
        if (!outcome.ok) {
            if (outcome.kind === 'conflict') setLock({ key, revision })
            showFailure(outcome, input, current)
            return
        }
        const { response } = outcome
        const persisted = remember({ id, name, editSecret, revision: response.revision, updatedAt: response.updatedAt })
        showSuccess(response.path, input, 'version', persisted, current)
        onUpdated(response, input)
    }

    function openForm() {
        if (formOpen) {
            nameInput.current?.focus()
            return
        }
        setForm({ name: copyName(entry?.name ?? 'Custom build'), key: entry?.key })
    }

    function closeForm() {
        setForm(null)
        copyButton.current?.focus()
    }

    function onNameKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') return
        e.preventDefault()
        void submitCopy()
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

    function hideLink() {
        const by = saved?.by
        setSaved(null)
        setCopy('idle')
        const saver = by === 'version' ? versionButton.current : copyButton.current
        if (saver !== null && !saver.disabled) saver.focus()
        else copyButton.current?.focus()
    }

    return (
        <>
            {showVersion ? (
                <button
                    ref={versionButton}
                    type="button"
                    data-testid="save-build"
                    className={cn('btn btn-outline-primary', styles.saveButton)}
                    disabled={!canSaveVersion}
                    aria-busy={busy ? 'true' : undefined}
                    onClick={saveVersion}
                >
                    Save a new version
                </button>
            ) : null}
            <button
                ref={copyButton}
                type="button"
                data-testid="save-build-copy"
                className={cn('btn btn-outline-primary', styles.saveButton)}
                disabled={!canSave}
                aria-busy={busy ? 'true' : undefined}
                onClick={openForm}
            >
                Save as copy
            </button>
            {formOpen ? (
                <div
                    role="group"
                    aria-label="Save as copy"
                    data-testid="save-copy-form"
                    className={styles.copyForm}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') return
                        e.preventDefault()
                        closeForm()
                    }}
                >
                    <div className={styles.copyNameField}>
                        <input
                            ref={nameInput}
                            type="text"
                            data-testid="save-copy-name"
                            aria-label="Name of the copy"
                            className={cn('form-control', !nameOk && 'is-invalid')}
                            value={form.name}
                            aria-invalid={nameOk ? undefined : 'true'}
                            aria-describedby={nameOk ? undefined : NAME_ERROR_ID}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            onKeyDown={onNameKey}
                        />
                        {nameOk ? null : (
                            <div id={NAME_ERROR_ID} data-testid="save-copy-name-error" className="invalid-feedback">
                                {`Enter a name of 1 to ${SAVED_NAME_MAX_CHARS} characters.`}
                            </div>
                        )}
                    </div>
                    <button type="button" data-testid="save-copy-submit" className="btn btn-primary" disabled={!canSubmit} onClick={submitCopy}>
                        Save copy
                    </button>
                    <button type="button" data-testid="save-copy-cancel" className="btn btn-outline-secondary" onClick={closeForm}>
                        Cancel
                    </button>
                </div>
            ) : null}
            {saved !== null && linkVisible ? (
                <div
                    className={styles.linkPanel}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') return
                        e.preventDefault()
                        hideLink()
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
            {unstoredVisible ? (
                <p data-testid="my-builds-unavailable" role="status" className={cn('text-warning-emphasis', styles.saveNotice)}>
                    {UNSTORED_TEXT}
                </p>
            ) : null}
            {error !== null && errorVisible ? (
                <p data-testid="save-build-error" role="alert" className={cn('text-danger', styles.saveError)}>
                    {error.message}
                </p>
            ) : null}
        </>
    )
}
