import cn from 'classnames'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import type { CreateNamedBuildResponse, UpdateNamedBuildResponse } from '../../../lib/aoe4-build-order/named-builds'
import type { TextToBuildResult } from '../../../lib/aoe4-build-order/text-to-build'
import { type AutoRunStatus, type LiveInput, sameInput } from './auto-run'
import { browserStorage } from './browser-storage'
import { copyName, entryKey, type LibraryEntry } from './build-library'
import { type MyBuildEntry, myBuildsAvailable, upsertMyBuild } from './my-builds-storage'
import { NameForm } from './name-form'
import { createNamedBuild, type NamedSaveFailure, renameNamedBuild, updateNamedBuild } from './named-build-client'
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
    onRenamed: (response: UpdateNamedBuildResponse, name: string) => void
}

type CopyState = 'idle' | 'copied' | 'failed'
type SaveOutcome<R> = { ok: true; response: R } | NamedSaveFailure

export type Saver = 'copy' | 'version' | 'rename'

export interface SavedStatus {
    input: LiveInput
    by: Saver
    revision: number
}

type Saved = SavedStatus & { link: string }

interface Lock {
    key: string
    revision: number
}

const UNSTORED_TEXT = 'This browser could not store the edit key, so you can edit this build only until you close the page.'

function remember(entry: MyBuildEntry): boolean {
    const storage = browserStorage()
    return storage !== null && myBuildsAvailable(storage) && upsertMyBuild(storage, entry).persisted
}

export function saveStatusText(saved: SavedStatus | null, settled: LiveInput, saving: boolean): string {
    if (saving || saved === null || !sameInput(saved.input, settled)) return ''
    if (saved.by === 'rename') return 'Renamed'
    return saved.by === 'version' ? `Saved version ${saved.revision}` : 'Saved'
}

export function SaveBuild({ status, settled, conversion, busy, entry, editSecret, edited, onCreated, onUpdated, onRenamed }: SaveBuildProps) {
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<{ kind: 'copy' | 'rename'; key: string | undefined } | null>(null)
    const [saved, setSaved] = useState<Saved | null>(null)
    const [error, setError] = useState<{ message: string; input: LiveInput } | null>(null)
    const [unstored, setUnstored] = useState<LiveInput | null>(null)
    const [lock, setLock] = useState<Lock | null>(null)
    const [copy, setCopy] = useState<CopyState>('idle')
    const settledNow = useRef(settled)
    const mounted = useRef(true)
    const abort = useRef<AbortController | null>(null)
    const versionButton = useRef<HTMLButtonElement>(null)
    const renameButton = useRef<HTMLButtonElement>(null)
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

    const canSave = status === 'current' && conversion.ok && !busy && !saving
    const showVersion = entry?.kind === 'mine' && editSecret !== null
    const canSaveVersion = canSave && edited && !locked
    const renameRevision = entry?.loaded?.revision
    const canRename = showVersion && !busy && !saving && !locked && typeof renameRevision === 'number'

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

    function showSuccess(path: string, input: LiveInput, by: Saver, revision: number, persisted: boolean, current: boolean) {
        if (current) {
            setError(null)
            setCopy('idle')
            setSaved({ link: window.location.origin + path, input, by, revision })
        }
        if (!persisted) setUnstored(current ? input : settledNow.current)
    }

    function showFailure(failure: NamedSaveFailure, input: LiveInput, current: boolean) {
        if (!current) return
        setSaved(null)
        setCopy('idle')
        setError({ message: failure.message, input })
    }

    async function submitCopy(name: string) {
        if (!canSave || !conversion.ok || abort.current !== null) return
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
        showSuccess(response.path, { ...input, selected: entryKey.named(response.id) }, 'copy', 1, persisted, current)
        onCreated(response, input, name)
    }

    // Sends a write to one of My builds and records its answer: a conflict locks the build, a failure
    // shows its message, and a success stores the new revision. Resolves to the response only on success.
    async function writeMine(
        by: 'version' | 'rename',
        target: { id: string; key: string; name: string; editSecret: string; revision: number },
        request: (signal: AbortSignal) => Promise<SaveOutcome<UpdateNamedBuildResponse>>,
    ): Promise<UpdateNamedBuildResponse | null> {
        const { id, key, name, editSecret, revision } = target
        const input = settled
        const sent = await send(input, request)
        if (sent === null) return null
        const { outcome, current } = sent
        if (!outcome.ok) {
            if (outcome.kind === 'conflict') setLock({ key, revision })
            showFailure(outcome, input, current)
            return null
        }
        const { response } = outcome
        const persisted = remember({ id, name, editSecret, revision: response.revision, updatedAt: response.updatedAt })
        showSuccess(response.path, input, by, response.revision, persisted, current)
        return response
    }

    async function saveVersion() {
        if (!canSaveVersion || !conversion.ok || entry?.kind !== 'mine' || entry.id === null || editSecret === null || abort.current !== null) return
        const revision = entry.loaded?.revision
        if (revision === undefined || revision === null) return
        const { id, key, name } = entry
        const input = settled
        const order = { ...conversion.order, name }
        const body = { buildOrder: order, durationSeconds: Number(input.duration) }
        const response = await writeMine('version', { id, key, name, editSecret, revision }, (signal) => updateNamedBuild(id, editSecret, revision, body, signal))
        if (response !== null) onUpdated(response, input)
    }

    async function submitRename(name: string) {
        if (!canRename || entry?.kind !== 'mine' || entry.id === null || editSecret === null || abort.current !== null) return
        const revision = entry.loaded?.revision
        if (typeof revision !== 'number') return
        const { id, key } = entry
        setForm(null)
        const response = await writeMine('rename', { id, key, name, editSecret, revision }, (signal) => renameNamedBuild(id, editSecret, revision, name, signal))
        if (response !== null) onRenamed(response, name)
    }

    function openForm(kind: 'copy' | 'rename') {
        if (form?.kind === kind && formOpen) {
            nameInput.current?.focus()
            return
        }
        setForm({ kind, key: entry?.key })
    }

    function closeForm() {
        const kind = form?.kind
        setForm(null)
        if (kind === 'rename') renameButton.current?.focus()
        else copyButton.current?.focus()
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
        const saver = by === 'rename' ? renameButton.current : by === 'version' ? versionButton.current : copyButton.current
        if (saver !== null && !saver.disabled) saver.focus()
        else copyButton.current?.focus()
    }

    function onLinkKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLButtonElement>) {
        if (e.key !== 'Escape') return
        e.preventDefault()
        hideLink()
    }

    return (
        <div data-testid="save-panel" className={styles.savePanel}>
            <div data-testid="save-row" className={styles.saveRow}>
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
                {showVersion ? (
                    <button
                        ref={renameButton}
                        type="button"
                        data-testid="rename-build"
                        className={cn('btn btn-outline-primary', styles.saveButton)}
                        disabled={!canRename}
                        onClick={() => openForm('rename')}
                    >
                        Rename
                    </button>
                ) : null}
                <button
                    ref={copyButton}
                    type="button"
                    data-testid="save-build-copy"
                    className={cn('btn btn-outline-primary', styles.saveButton)}
                    disabled={!canSave}
                    aria-busy={busy ? 'true' : undefined}
                    onClick={() => openForm('copy')}
                >
                    Save as copy
                </button>
                <p data-testid="save-status" role="status" aria-live="polite" aria-atomic="true" className={styles.saveStatus}>
                    {saveStatusText(saved, settled, saving)}
                </p>
                {saved !== null && linkVisible ? (
                    <>
                        <input
                            ref={linkInput}
                            type="text"
                            readOnly
                            data-testid="saved-build-link"
                            aria-label="Link to this saved build"
                            className={cn('form-control', styles.linkInput)}
                            value={saved.link}
                            onKeyDown={onLinkKeyDown}
                        />
                        <button type="button" data-testid="copy-saved-link" className="btn btn-outline-secondary" onClick={copyLink} onKeyDown={onLinkKeyDown}>
                            {copy === 'copied' ? 'Copied' : 'Copy link'}
                        </button>
                    </>
                ) : null}
            </div>
            {formOpen && form?.kind === 'copy' ? (
                <NameForm
                    testIdPrefix="save-copy"
                    label="Name of the copy"
                    submitText="Save copy"
                    initialName={copyName(entry?.name ?? 'Custom build')}
                    canSubmit={canSave}
                    onSubmit={submitCopy}
                    onCancel={closeForm}
                    inputRef={nameInput}
                />
            ) : null}
            {formOpen && form?.kind === 'rename' && showVersion ? (
                <NameForm
                    testIdPrefix="rename"
                    label="New name"
                    submitText="Save name"
                    initialName={entry?.name ?? ''}
                    unchangedName={entry?.name}
                    canSubmit={canRename}
                    onSubmit={submitRename}
                    onCancel={closeForm}
                    inputRef={nameInput}
                />
            ) : null}
            {copy === 'failed' && linkVisible ? (
                <p data-testid="copy-saved-link-hint" className={styles.linkHint}>
                    Could not copy. Select the link and copy it by hand.
                </p>
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
        </div>
    )
}
