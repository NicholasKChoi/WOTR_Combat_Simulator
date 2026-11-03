import utilStyles from '../../styles/utils.module.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import cn from 'classnames'

import Layout from '../../components/layout'
import { BuildInput, type EditorView, type PrebuiltBuild } from '../../components/apps/aoe4-build-order/build-input'
import { BuildTextEditor } from '../../components/apps/aoe4-build-order/build-text-editor'
import { IssueList } from '../../components/apps/aoe4-build-order/issue-list'
import { issueLines } from '../../components/apps/aoe4-build-order/text-lines'
import { pinName } from '../../components/apps/aoe4-build-order/pin-name'
import { clearStoredPin, readStoredPin, writeStoredPin } from '../../components/apps/aoe4-build-order/pin-storage'
import { ComparePanel } from '../../components/apps/aoe4-build-order/compare-panel'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { StepTable } from '../../components/apps/aoe4-build-order/step-table'
import { WorkbenchTabs, type WorkbenchTab } from '../../components/apps/aoe4-build-order/workbench-tabs'
import { listBuilds } from '../../lib/aoe4-build-order/builds'
import { loadGameData } from '../../lib/aoe4-build-order/data'
import { formatBuildOrderText, parseBuildOrderText } from '../../lib/aoe4-build-order/parse-text'
import { type BuildOrderCatalog, buildOrderCatalog } from '../../lib/aoe4-build-order/schema'
import { textToBuildOrder } from '../../lib/aoe4-build-order/text-to-build'
import type { SimulateError, SimulateRequest, SimulateResponse } from '../../lib/aoe4-build-order/api'

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

function browserStorage(): Storage | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

function postSimulation(buildOrder: SimulateRequest['buildOrder'], durationSeconds: number): Promise<Response> {
    const request: SimulateRequest = { buildOrder, inputs: { durationSeconds } }
    return fetch('/api/aoe4-build-order/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
    })
}

async function errorMessages(response: Response): Promise<string[]> {
    if (response.status === 400) {
        try {
            const body: Partial<SimulateError> = await response.json()
            if (Array.isArray(body.issues) && body.issues.length > 0) {
                const messages = body.issues.map((issue) => issue.message)
                if (typeof body.omittedIssues === 'number' && body.omittedIssues > 0) {
                    messages.push(`${body.omittedIssues} more issues not shown.`)
                }
                return messages
            }
        } catch {}
    }
    return [`The simulation could not be run (HTTP ${response.status}).`]
}

export default function AoE4BuildOrder({ builds, catalog }: PageProps) {
    const [text, setText] = useState(builds[0]?.text ?? '')
    const [duration, setDuration] = useState(String(DEFAULT_DURATION_SECONDS))
    const [result, setResult] = useState<SimulateResponse | null>(null)
    const [run, setRun] = useState<Run | null>(null)
    const [pin, setPin] = useState<Pin | null>(null)
    const [selected, setSelected] = useState(builds[0]?.name ?? '')
    const [issues, setIssues] = useState<string[]>([])
    const [checked, setChecked] = useState(false)
    const [rejection, setRejection] = useState<{ line: number | undefined } | null>(null)
    const [running, setRunning] = useState(false)
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [tab, setTab] = useState<WorkbenchTab>('build')
    const [view, setView] = useState<EditorView>('text')
    const [resultsShownCount, setResultsShownCount] = useState(0)
    const pinTouched = useRef(false)
    const resultsTop = useRef<HTMLDivElement>(null)
    const runBar = useRef<HTMLFormElement>(null)
    const editorBox = useRef<HTMLDivElement>(null)
    const issuesBox = useRef<HTMLDivElement>(null)
    const resultsEnabled = result !== null || pin !== null
    const shownTab = resultsEnabled ? tab : 'build'
    const parsed = useMemo(() => parseBuildOrderText(text), [text])
    const converted = useMemo(() => textToBuildOrder(text, catalog), [text, catalog])
    const clientIssues = converted.ok || (converted.lines !== undefined && !checked) ? [] : converted.issues

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
                if (response.status === 400) clearStoredPin(storage)
                if (!response.ok) return
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
        const panel = resultsTop.current
        if (resultsShownCount === 0 || !panel) return
        panel.style.scrollMarginTop = `${runBar.current?.getBoundingClientRect().height ?? 0}px`
        panel.scrollIntoView()
    }, [resultsShownCount])

    useEffect(() => {
        if (rejection === null) return
        const marginTop = `${runBar.current?.getBoundingClientRect().height ?? 0}px`
        const { line } = rejection
        const item = view === 'text' && line !== undefined ? editorBox.current?.querySelector(`[data-testid="build-order-line-number"][data-line="${line}"]`) : null
        const target = item ?? issuesBox.current
        if (!(target instanceof HTMLElement)) return
        target.style.scrollMarginTop = marginTop
        target.scrollIntoView({ block: 'center' })
    }, [rejection])

    async function runSimulation() {
        setChecked(true)
        setIssues([])
        const runText = text
        if (converted.ok === false) {
            setResult(null)
            setRun(null)
            setTab('build')
            setRejection({ line: converted.issues[0].line })
            return
        }
        setRunning(true)
        try {
            const response = await postSimulation(converted.order, Number(duration))
            if (!response.ok) {
                setResult(null)
                setRun(null)
                setTab('build')
                setIssues(await errorMessages(response))
                return
            }
            const body: SimulateResponse = await response.json()
            setResult(body)
            setRun({ text: runText, durationSeconds: Number(duration), name: pinName(builds, runText, selected) })
            setTab('results')
            setResultsShownCount((n) => n + 1)
        } catch {
            setResult(null)
            setRun(null)
            setTab('build')
            setIssues(['The simulation could not be run. Please try again.'])
        } finally {
            setRunning(false)
        }
    }

    const alreadyPinned = result !== null && run !== null && pin !== null && pin.text === run.text && pin.durationSeconds === run.durationSeconds
    const stale = result !== null && run !== null && (text !== run.text || Number(duration) !== run.durationSeconds)

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
                    builds={builds}
                    selected={selected}
                    onSelectedChange={setSelected}
                    onTextChange={setText}
                    duration={duration}
                    onDurationChange={setDuration}
                    running={running}
                    onRun={runSimulation}
                    view={view}
                    onViewChange={setView}
                    formRef={runBar}
                />
                <WorkbenchTabs
                    active={shownTab}
                    onSelect={setTab}
                    resultsEnabled={resultsEnabled}
                    build={
                        <>
                            {view === 'text' ? (
                                <div ref={editorBox}>
                                    <BuildTextEditor text={text} onChange={setText} errorLines={issueLines(clientIssues)} />
                                </div>
                            ) : parsed.ok === true ? (
                                <StepTable order={parsed.order} catalog={catalog} onChange={(order) => setText(formatBuildOrderText(order))} />
                            ) : (
                                <div data-testid="step-table-unavailable" className="alert alert-secondary">
                                    {parsed.issues[0].message}
                                </div>
                            )}
                            <div ref={issuesBox}>
                                <IssueList issues={clientIssues} />
                            </div>
                            {issues.length > 0 ? (
                                <div data-testid="simulation-error" role="alert" className="alert alert-danger">
                                    <ul className="mb-0">
                                        {issues.map((message, i) => (
                                            <li key={i}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </>
                    }
                    results={
                        <div ref={resultsTop}>
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
                                    stale={stale}
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
