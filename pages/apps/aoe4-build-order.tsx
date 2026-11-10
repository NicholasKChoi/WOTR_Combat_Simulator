import utilStyles from '../../styles/utils.module.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cn from 'classnames'

import Layout from '../../components/layout'
import { BuildInput, type EditorView, type PrebuiltBuild } from '../../components/apps/aoe4-build-order/build-input'
import { BuildTextEditor } from '../../components/apps/aoe4-build-order/build-text-editor'
import { IssueList } from '../../components/apps/aoe4-build-order/issue-list'
import { issueLines } from '../../components/apps/aoe4-build-order/text-lines'
import type { LiveInput } from '../../components/apps/aoe4-build-order/auto-run'
import { pinName } from '../../components/apps/aoe4-build-order/pin-name'
import { clearStoredPin, readStoredPin, writeStoredPin } from '../../components/apps/aoe4-build-order/pin-storage'
import { ComparePanel } from '../../components/apps/aoe4-build-order/compare-panel'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { StepTable } from '../../components/apps/aoe4-build-order/step-table'
import { mergeExternalEdit } from '../../components/apps/aoe4-build-order/step-table-model'
import { loadSavedBuild, savedBuildOption } from '../../components/apps/aoe4-build-order/saved-build-loader'
import { postSimulation } from '../../components/apps/aoe4-build-order/simulate-client'
import { useAutoRun } from '../../components/apps/aoe4-build-order/use-auto-run'
import { useSplitLayout } from '../../components/apps/aoe4-build-order/use-split-layout'
import { WorkbenchTabs, type WorkbenchTab } from '../../components/apps/aoe4-build-order/workbench-tabs'
import { listBuilds } from '../../lib/aoe4-build-order/builds'
import { loadGameData } from '../../lib/aoe4-build-order/data'
import { formatBuildOrderText, parseBuildOrderText } from '../../lib/aoe4-build-order/parse-text'
import { type BuildOrderCatalog, buildOrderCatalog } from '../../lib/aoe4-build-order/schema'
import { textToBuildOrder } from '../../lib/aoe4-build-order/text-to-build'
import type { SimulateResponse } from '../../lib/aoe4-build-order/api'
import type { SaveBuildResponse } from '../../lib/aoe4-build-order/saved-builds'

const pageTitle = 'AoE4 Build Order Simulator'
const DEFAULT_DURATION_SECONDS = 1200

interface PageProps {
    builds: PrebuiltBuild[]
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

const sameInput = (a: LiveInput, b: LiveInput) => a.text === b.text && a.duration === b.duration && a.selected === b.selected

function firstQueryValue(value: string | string[] | undefined): string | undefined {
    const first = Array.isArray(value) ? value[0] : value
    return first === undefined || first === '' ? undefined : first
}

function browserStorage(): Storage | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

export default function AoE4BuildOrder({ builds: prebuilt, catalog }: PageProps) {
    const router = useRouter()
    const [builds, setBuilds] = useState(prebuilt)
    const [text, setText] = useState(builds[0]?.text ?? '')
    const [duration, setDuration] = useState(String(DEFAULT_DURATION_SECONDS))
    const [pin, setPin] = useState<Pin | null>(null)
    const [selected, setSelected] = useState(builds[0]?.name ?? '')
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [tab, setTab] = useState<WorkbenchTab>('build')
    const [view, setView] = useState<EditorView>('text')
    const [openRows, setOpenRows] = useState<boolean[]>([])
    const [loadEnded, setLoadEnded] = useState(false)
    const [loadError, setLoadError] = useState<keyof typeof LOAD_ERRORS | null>(null)
    const [awaitingLoadTab, setAwaitingLoadTab] = useState(false)
    const [urlBaseline, setUrlBaseline] = useState<LiveInput | null>(null)
    const initialB = useRef<{ id: string | undefined } | null>(null)
    const pinTouched = useRef(false)
    const pageSection = useRef<HTMLElement>(null)
    const runBar = useRef<HTMLFormElement>(null)
    if (router.isReady && initialB.current === null) initialB.current = { id: firstQueryValue(router.query.b) }
    const savedLoadInFlight = router.isReady && initialB.current?.id !== undefined && !loadEnded
    const autoRun = useAutoRun({ text, duration, selected, catalog, hold: !router.isReady || savedLoadInFlight })
    const { status, conversion, result, shown, settled } = autoRun
    const run: Run | null = shown === null ? null : { text: shown.text, durationSeconds: shown.durationSeconds, name: pinName(builds, shown.text, shown.selected) }
    const resultsEnabled = result !== null || pin !== null
    const shownTab = resultsEnabled ? tab : 'build'
    const split = useSplitLayout()
    const parsed = useMemo(() => parseBuildOrderText(text), [text])
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
        const id = initialB.current?.id
        if (!router.isReady || id === undefined) return
        const controller = new AbortController()
        loadSavedBuild(id, controller.signal).then((loaded) => {
            if (controller.signal.aborted) return
            if (loaded.status === 'ok') {
                const option = savedBuildOption(id, loaded.saved)
                const input = { text: option.text, duration: String(loaded.saved.durationSeconds), selected: option.name }
                setBuilds((list) => [option, ...list])
                setSelected(input.selected)
                editText(input.text)
                setDuration(input.duration)
                setUrlBaseline(input)
                setAwaitingLoadTab(true)
            } else {
                setLoadError(loaded.status)
                setUrlBaseline({ text: prebuilt[0]?.text ?? '', duration: String(DEFAULT_DURATION_SECONDS), selected: prebuilt[0]?.name ?? '' })
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

    useEffect(() => {
        if (urlBaseline === null || status === 'loading' || sameInput(settled, urlBaseline)) return
        setUrlBaseline(null)
        router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true })
    }, [urlBaseline, status, settled])

    useEffect(() => {
        const bar = runBar.current
        const section = pageSection.current
        if (!bar || !section) return
        const observer = new ResizeObserver(() => {
            section.style.setProperty('--run-bar-height', `${bar.getBoundingClientRect().height}px`)
        })
        observer.observe(bar)
        return () => observer.disconnect()
    }, [])

    function editText(next: string) {
        const reparsed = parseBuildOrderText(next)
        if (reparsed.ok === true) setOpenRows((flags) => mergeExternalEdit(flags, reparsed.order.steps))
        setText(next)
    }

    function selectBuild(name: string) {
        setSelected(name)
        const build = builds.find((b) => b.name === name)
        if (!build) return
        editText(build.text)
        autoRun.flush({ text: build.text, duration, selected: name })
    }

    function recordSave(response: SaveBuildResponse, input: LiveInput) {
        setUrlBaseline(input)
        router.replace({ pathname: router.pathname, query: { b: response.id } }, undefined, { shallow: true })
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
            <section ref={pageSection} className={cn(utilStyles.headingMd, 'container')}>
                <h1>{pageTitle}</h1>
                <BuildInput
                    builds={builds}
                    selected={selected}
                    onBuildSelect={selectBuild}
                    duration={duration}
                    onDurationChange={setDuration}
                    durationError={autoRun.durationError}
                    status={status}
                    settled={settled}
                    conversion={conversion}
                    busy={savedLoadInFlight}
                    onSaved={recordSave}
                    hasResult={result !== null}
                    onSubmit={() => autoRun.flush()}
                    view={view}
                    onViewChange={setView}
                    viewDisabled={!split && shownTab === 'results'}
                    formRef={runBar}
                />
                {loadError !== null ? (
                    <div data-testid="saved-build-error" role="alert" className="alert alert-warning">
                        {LOAD_ERRORS[loadError]}
                    </div>
                ) : null}
                <WorkbenchTabs
                    active={shownTab}
                    onSelect={setTab}
                    resultsEnabled={resultsEnabled}
                    split={split}
                    build={
                        <>
                            {view === 'text' ? (
                                <BuildTextEditor text={text} onChange={editText} errorLines={issueLines(clientIssues)} disabled={savedLoadInFlight} />
                            ) : parsed.ok === true ? (
                                <StepTable
                                    order={parsed.order}
                                    catalog={catalog}
                                    onChange={(order) => setText(formatBuildOrderText(order))}
                                    openRows={openRows}
                                    onOpenRowsChange={setOpenRows}
                                    disabled={savedLoadInFlight}
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
                            <h2 className="border-bottom">Results</h2>
                            <ComparePanel
                                current={result}
                                pinned={pin?.result ?? null}
                                pinnedName={pin?.name ?? null}
                                alreadyPinned={alreadyPinned}
                                onPin={pinShownRun}
                                onUnpin={unpin}
                            />
                            {result !== null ? (
                                <Results
                                    result={result}
                                    pinned={pin?.result ?? null}
                                    text={run?.text ?? ''}
                                    landmarks={catalog.landmarks}
                                    dimmed={status === 'invalid' || status === 'rejected' || status === 'failed'}
                                    infoExpanded={infoExpanded}
                                    onInfoToggle={() => setInfoExpanded((v) => !v)}
                                />
                            ) : null}
                        </div>
                    }
                />
            </section>
        </Layout>
    )
}
