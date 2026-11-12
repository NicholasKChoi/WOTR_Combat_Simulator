import utilStyles from '../../styles/utils.module.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cn from 'classnames'

import Layout from '../../components/layout'
import { BuildInput, type EditorView } from '../../components/apps/aoe4-build-order/build-input'
import { BuildTextEditor } from '../../components/apps/aoe4-build-order/build-text-editor'
import { IssueList } from '../../components/apps/aoe4-build-order/issue-list'
import { statusDescribesResults } from '../../components/apps/aoe4-build-order/auto-run-status'
import { buildAnnotations } from '../../components/apps/aoe4-build-order/step-annotations'
import { issueLines } from '../../components/apps/aoe4-build-order/text-lines'
import { type LiveInput, resultsStale, sameInput } from '../../components/apps/aoe4-build-order/auto-run'
import { browserStorage } from '../../components/apps/aoe4-build-order/browser-storage'
import {
    entryKey,
    entryLabel,
    isEdited,
    linkEntry,
    mineEntries,
    namedEntry,
    runName,
    savedMineEntry,
    templateEntries,
    withLoadedEntry,
    withMyBuilds,
    type LibraryEntry,
} from '../../components/apps/aoe4-build-order/build-library'
import { type InitialBuildQuery, initialBuildQuery, nextBuildQuery } from '../../components/apps/aoe4-build-order/build-query'
import { MY_BUILDS_STORAGE_KEY, type MyBuildEntry, myBuildsAvailable, readMyBuilds } from '../../components/apps/aoe4-build-order/my-builds-storage'
import { loadNamedBuild } from '../../components/apps/aoe4-build-order/named-build-client'
import { clearStoredPin, readStoredPin, writeStoredPin } from '../../components/apps/aoe4-build-order/pin-storage'
import { ComparePanel } from '../../components/apps/aoe4-build-order/compare-panel'
import { KEY_RESULTS_PANEL_ID } from '../../components/apps/aoe4-build-order/chart-layout'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { StepTable } from '../../components/apps/aoe4-build-order/step-table'
import { mergeExternalEdit } from '../../components/apps/aoe4-build-order/step-table-model'
import { loadSavedBuild } from '../../components/apps/aoe4-build-order/saved-build-loader'
import { postSimulation } from '../../components/apps/aoe4-build-order/simulate-client'
import { useAutoRun } from '../../components/apps/aoe4-build-order/use-auto-run'
import { useRunBarHeight } from '../../components/apps/aoe4-build-order/use-run-bar-height'
import { useDiscardGuard } from '../../components/apps/aoe4-build-order/use-discard-guard'
import { useChartLayout } from '../../components/apps/aoe4-build-order/use-chart-layout'
import { useSplitLayout } from '../../components/apps/aoe4-build-order/use-split-layout'
import { WorkbenchTabs, type WorkbenchTab } from '../../components/apps/aoe4-build-order/workbench-tabs'
import { listBuilds } from '../../lib/aoe4-build-order/builds'
import { loadGameData } from '../../lib/aoe4-build-order/data'
import { formatBuildOrderText, parseBuildOrderText } from '../../lib/aoe4-build-order/parse-text'
import { type BuildOrderCatalog, buildOrderCatalog } from '../../lib/aoe4-build-order/schema'
import { textToBuildOrder } from '../../lib/aoe4-build-order/text-to-build'
import type { SimulateResponse } from '../../lib/aoe4-build-order/api'
import type { CreateNamedBuildResponse, UpdateNamedBuildResponse } from '../../lib/aoe4-build-order/named-builds'

const pageTitle = 'AoE4 Build Order Simulator'
const DEFAULT_DURATION_SECONDS = 1200

interface PageProps {
    builds: { name: string; text: string }[]
    catalog: BuildOrderCatalog
}

export const getStaticProps: GetStaticProps<PageProps> = async () => ({
    props: {
        builds: listBuilds().map((order) => ({ name: order.name, text: formatBuildOrderText(order) })),
        catalog: buildOrderCatalog(loadGameData('english')),
    },
})

interface Run {
    text: string
    durationSeconds: number
    name: string
}

interface Pin extends Run {
    result: SimulateResponse
}

const LOAD_ERRORS = {
    'not-found': 'That saved build was not found. Showing the default build.',
    failed: 'That saved build could not be loaded. Showing the default build.',
}

const CHOOSE_ERRORS = {
    'not-found': 'That build was not found. The current build is unchanged.',
    failed: 'That build could not be loaded. The current build is unchanged.',
}

type EntryLoad = { status: 'ok'; entry: LibraryEntry } | { status: 'not-found' } | { status: 'failed' }

async function loadNamedEntry(kind: 'mine' | 'shared', id: string, signal: AbortSignal): Promise<EntryLoad> {
    const loaded = await loadNamedBuild(id, signal)
    return loaded.status === 'ok' ? { status: 'ok', entry: namedEntry(kind, loaded.build) } : loaded
}

async function loadInitialEntry(query: { kind: 'named' | 'link'; id: string }, signal: AbortSignal): Promise<EntryLoad> {
    if (query.kind === 'link') {
        const loaded = await loadSavedBuild(query.id, signal)
        return loaded.status === 'ok' ? { status: 'ok', entry: linkEntry(query.id, loaded.saved) } : loaded
    }
    const storage = browserStorage()
    const mine = storage === null ? [] : readMyBuilds(storage)
    return loadNamedEntry(mine.some((build) => build.id === query.id) ? 'mine' : 'shared', query.id, signal)
}

function secretsOf(stored: readonly MyBuildEntry[]): Record<string, string> {
    return Object.fromEntries(stored.map((build) => [build.id, build.editSecret]))
}

// Another tab rewrote the stored list: its entries replace this tab's My builds, except the selected
// one, which keeps the version this tab loaded so the edited marker and Save stay as they were.
function withRereadMyBuilds(list: readonly LibraryEntry[], mine: readonly LibraryEntry[], selectedKey: string): LibraryEntry[] {
    const selected = list.find((entry) => entry.kind === 'mine' && entry.key === selectedKey)
    const fresh = mine.map((entry) => (entry.key === selected?.key ? selected : entry))
    const kept = selected !== undefined && !mine.some((entry) => entry.key === selected.key) ? [selected] : []
    return [...list.filter((entry) => entry.kind !== 'mine'), ...kept, ...fresh]
}

function confirmDiscard(label: string): boolean {
    return window.confirm(`Discard your edits to "${label}"?`)
}

export default function AoE4BuildOrder({ builds, catalog }: PageProps) {
    const router = useRouter()
    const [entries, setEntries] = useState(() => templateEntries(builds))
    const [text, setText] = useState(builds[0]?.text ?? '')
    const [duration, setDuration] = useState(String(DEFAULT_DURATION_SECONDS))
    const [pin, setPin] = useState<Pin | null>(null)
    const [selected, setSelected] = useState(entries[0]?.key ?? '')
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [tab, setTab] = useState<WorkbenchTab>('build')
    const [view, setView] = useState<EditorView>('text')
    const [openRows, setOpenRows] = useState<boolean[]>([])
    const [initialQuery, setInitialQuery] = useState<InitialBuildQuery | null>(null)
    const [loadEnded, setLoadEnded] = useState(false)
    const [choosing, setChoosing] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [awaitingLoadTab, setAwaitingLoadTab] = useState(false)
    const [active, setActive] = useState<{ result: SimulateResponse; step: number } | null>(null)
    const [secrets, setSecrets] = useState<Record<string, string>>({})
    const pinTouched = useRef(false)
    const runBarRef = useRef<HTMLFormElement>(null)
    useRunBarHeight(runBarRef)
    const chooseAbort = useRef<AbortController | null>(null)
    const initialLoadInFlight = initialQuery !== null && initialQuery.kind !== 'none' && !loadEnded
    const busy = initialLoadInFlight || choosing
    const autoRun = useAutoRun({ text, duration, selected, catalog, hold: initialQuery === null || initialLoadInFlight })
    const { status, conversion, result, shown, settled } = autoRun
    const settledRef = useRef(settled)
    const selectedRef = useRef(selected)
    const run: Run | null = shown === null ? null : { text: shown.text, durationSeconds: shown.durationSeconds, name: runName(entries, shown.text, shown.selected) }
    const selectedEntry = entries.find((entry) => entry.key === selected)
    const edited = isEdited(selectedEntry, { text, duration })
    const editSecret = selectedEntry?.kind === 'mine' && selectedEntry.id !== null ? (secrets[selectedEntry.id] ?? null) : null
    useDiscardGuard(edited)
    const resultsEnabled = result !== null || pin !== null
    const shownTab = resultsEnabled ? tab : 'build'
    const split = useSplitLayout()
    const chartLayout = useChartLayout()
    const parsed = useMemo(() => parseBuildOrderText(text), [text])
    const liveSteps = parsed.ok ? parsed.order.steps : parsed.partial.order.steps
    const stale = useMemo(() => resultsStale({ status, result, shown }, { text, duration, selected }), [status, result, shown, text, duration, selected])
    const annotations = useMemo(
        () => buildAnnotations({ result, shown, live: { text, duration, selected }, liveSteps, landmarks: catalog.landmarks, stale }),
        [result, shown, text, duration, selected, liveSteps, catalog.landmarks, stale],
    )
    const onActiveStepChange = (step: number | null) => setActive(step === null || result === null ? null : { result, step })
    const activeStep =
        active !== null && active.result === result && annotations?.steps.some((s) => s.run?.runStep === active.step) ? active.step : null
    const clientIssues = conversion.ok ? [] : conversion.issues
    const rejected = status === 'rejected'

    useEffect(() => {
        let cancelled = false
        const storage = browserStorage()
        const stored = storage ? readStoredPin(storage) : null
        if (!storage || !stored) return
        const restored = textToBuildOrder(stored.text, catalog)
        if (!restored.ok) {
            clearStoredPin(storage)
            return
        }
        postSimulation(restored.order, stored.durationSeconds)
            .then(async (response) => {
                if (cancelled || pinTouched.current) return
                if (!response.ok) {
                    clearStoredPin(storage)
                    return
                }
                const result: SimulateResponse = await response.json()
                if (cancelled || pinTouched.current) return
                setPin({ result, name: stored.name, text: stored.text, durationSeconds: stored.durationSeconds })
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const storage = browserStorage()
        if (storage === null || !myBuildsAvailable(storage)) return
        const stored = readMyBuilds(storage)
        setEntries((list) => withMyBuilds(list, mineEntries(stored)))
        setSecrets(secretsOf(stored))
    }, [])

    useEffect(() => {
        settledRef.current = settled
        selectedRef.current = selected
    }, [settled, selected])

    useEffect(() => {
        function reread(event: StorageEvent) {
            const storage = browserStorage()
            if (event.key !== MY_BUILDS_STORAGE_KEY || storage === null) return
            const stored = readMyBuilds(storage)
            setEntries((list) => withRereadMyBuilds(list, mineEntries(stored), selected))
            setSecrets((known) => ({ ...known, ...secretsOf(stored) }))
        }
        window.addEventListener('storage', reread)
        return () => window.removeEventListener('storage', reread)
    }, [selected])

    useEffect(() => () => chooseAbort.current?.abort(), [])

    useEffect(() => {
        if (!router.isReady) return
        const query = initialBuildQuery(router.query)
        setInitialQuery(query)
        if (query.kind === 'none') return
        const controller = new AbortController()
        void loadInitialEntry(query, controller.signal).then((loaded) => {
            if (controller.signal.aborted) return
            if (loaded.status === 'ok') {
                showEntry(loaded.entry)
                setAwaitingLoadTab(true)
            } else {
                setLoadError(LOAD_ERRORS[loaded.status])
            }
            setLoadEnded(true)
        })
        return () => controller.abort()
    }, [router.isReady])

    useEffect(() => {
        if (!awaitingLoadTab || status === 'loading' || status === 'running' || status === 'updating') return
        setAwaitingLoadTab(false)
        if (status === 'current') setTab('results')
    }, [awaitingLoadTab, status])

    function editText(next: string) {
        const reparsed = parseBuildOrderText(next)
        if (reparsed.ok === true) setOpenRows((flags) => mergeExternalEdit(flags, reparsed.order.steps))
        setText(next)
    }

    function replaceBuildQuery(entry: Pick<LibraryEntry, 'kind' | 'id'>) {
        router.replace({ pathname: router.pathname, query: nextBuildQuery(router.query, entry) }, undefined, { shallow: true })
    }

    function showEntry(entry: LibraryEntry) {
        const nextText = entry.loaded?.text ?? text
        const nextDuration = entry.loaded?.duration ?? duration
        setEntries((list) => withLoadedEntry(list, entry))
        setSelected(entry.key)
        editText(nextText)
        setDuration(nextDuration)
        replaceBuildQuery(entry)
        return { text: nextText, duration: nextDuration, selected: entry.key }
    }

    function chooseEntry(key: string) {
        const entry = entries.find((candidate) => candidate.key === key)
        if (entry === undefined) return
        if (selectedEntry !== undefined && edited && !confirmDiscard(entryLabel(selectedEntry, false))) {
            document.getElementById('build-order-select')?.focus()
            return
        }
        setLoadError(null)
        chooseAbort.current?.abort()
        chooseAbort.current = null
        setChoosing(false)
        if (entry.kind === 'template' || entry.kind === 'link' || entry.id === null) {
            autoRun.flush(showEntry(entry))
            return
        }
        const controller = new AbortController()
        chooseAbort.current = controller
        setChoosing(true)
        void loadNamedEntry(entry.kind, entry.id, controller.signal).then((loaded) => {
            if (controller.signal.aborted) return
            chooseAbort.current = null
            setChoosing(false)
            if (loaded.status === 'ok') autoRun.flush(showEntry(loaded.entry))
            else setLoadError(CHOOSE_ERRORS[loaded.status])
        })
    }

    function recordCreated(response: CreateNamedBuildResponse, input: LiveInput, name: string) {
        const entry = savedMineEntry(response.id, name, input, 1)
        setSecrets((known) => ({ ...known, [response.id]: response.editSecret }))
        setEntries((list) => [entry, ...list.filter((listed) => listed.key !== entry.key)])
        if (!sameInput(input, settledRef.current)) return
        setSelected(entry.key)
        autoRun.flush({ text: input.text, duration: input.duration, selected: entry.key })
        replaceBuildQuery(entry)
    }

    function recordUpdated(response: UpdateNamedBuildResponse, input: LiveInput) {
        const key = entryKey.named(response.id)
        const loaded = { text: input.text, duration: input.duration, revision: response.revision }
        setEntries((list) => list.map((entry) => (entry.key === key ? { ...entry, loaded } : entry)))
        if (selectedRef.current === key) replaceBuildQuery({ kind: 'mine', id: response.id })
    }

    const alreadyPinned = result !== null && run !== null && pin !== null && pin.text === run.text && pin.durationSeconds === run.durationSeconds

    function pinShownRun() {
        if (result === null || run === null) return
        pinTouched.current = true
        setPin({ result, ...run })
        const storage = browserStorage()
        if (storage) writeStoredPin(storage, { version: 1, name: run.name, text: run.text, durationSeconds: run.durationSeconds })
    }

    function unpin() {
        pinTouched.current = true
        setPin(null)
        const storage = browserStorage()
        if (storage) clearStoredPin(storage)
    }

    return (
        <Layout home={false}>
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <section className={cn(utilStyles.headingMd, 'container')}>
                <h1>{pageTitle}</h1>
                <BuildInput
                    runBarRef={runBarRef}
                    entries={entries}
                    selected={selected}
                    edited={edited}
                    onBuildSelect={chooseEntry}
                    duration={duration}
                    onDurationChange={setDuration}
                    durationError={autoRun.durationError}
                    status={status}
                    settled={settled}
                    conversion={conversion}
                    busy={busy}
                    entry={selectedEntry}
                    editSecret={editSecret}
                    onCreated={recordCreated}
                    onUpdated={recordUpdated}
                    hasResult={result !== null}
                    onSubmit={() => autoRun.flush()}
                    view={view}
                    onViewChange={setView}
                    viewDisabled={!split && shownTab === 'results'}
                />
                {loadError !== null ? (
                    <div data-testid="saved-build-error" role="alert" className="alert alert-warning">
                        {loadError}
                    </div>
                ) : null}
                <WorkbenchTabs
                    active={shownTab}
                    onSelect={setTab}
                    resultsEnabled={resultsEnabled}
                    split={split}
                    build={
                        <>
                            <h2 className="h4" id="build-order-heading" data-testid="build-order-heading">
                                Build order
                            </h2>
                            {view === 'text' ? (
                                <BuildTextEditor
                                    text={text}
                                    onChange={editText}
                                    errorLines={issueLines(clientIssues)}
                                    annotations={annotations}
                                    lines={parsed.ok ? parsed.lines : parsed.partial.lines}
                                    activeStep={activeStep}
                                    onActiveStepChange={onActiveStepChange}
                                    disabled={busy}
                                    labelledBy="build-order-heading"
                                />
                            ) : parsed.ok === true ? (
                                <StepTable
                                    order={parsed.order}
                                    catalog={catalog}
                                    onChange={(order) => setText(formatBuildOrderText(order))}
                                    openRows={openRows}
                                    onOpenRowsChange={setOpenRows}
                                    disabled={busy}
                                    annotations={annotations}
                                    activeStep={activeStep}
                                    onActiveStepChange={onActiveStepChange}
                                />
                            ) : (
                                <div data-testid="step-table-unavailable" className="alert alert-secondary">
                                    {parsed.issues[0].message}
                                </div>
                            )}
                            <IssueList issues={rejected ? autoRun.serverIssues : clientIssues} omittedIssues={rejected ? autoRun.omittedIssues : 0} />
                            {autoRun.errorMessage !== null ? (
                                <div data-testid="simulation-error" role="alert" className="alert alert-danger mt-2">
                                    <p className="mb-0">{autoRun.errorMessage}</p>
                                </div>
                            ) : null}
                            {status === 'failed' ? (
                                <button type="button" data-testid="simulation-retry" className="btn btn-outline-danger" onClick={autoRun.retry}>
                                    Try again
                                </button>
                            ) : null}
                        </>
                    }
                    results={
                        <div>
                            <h2 className="h4 border-bottom" data-testid="results-heading">
                                Results
                            </h2>
                            <ComparePanel
                                current={result}
                                pinned={pin?.result ?? null}
                                pinnedName={pin?.name ?? null}
                                alreadyPinned={alreadyPinned}
                                onPin={pinShownRun}
                                onUnpin={unpin}
                                collapsed={chartLayout.layout.collapsed.includes(KEY_RESULTS_PANEL_ID)}
                                onToggleCollapsed={() => chartLayout.toggle(KEY_RESULTS_PANEL_ID)}
                            />
                            {result !== null ? (
                                <Results
                                    result={result}
                                    pinned={pin?.result ?? null}
                                    activeStep={activeStep}
                                    dimmed={stale}
                                    describedByStatus={statusDescribesResults(stale, status, true)}
                                    infoExpanded={infoExpanded}
                                    onInfoToggle={() => setInfoExpanded((v) => !v)}
                                    chartLayout={chartLayout}
                                />
                            ) : null}
                        </div>
                    }
                />
            </section>
        </Layout>
    )
}
