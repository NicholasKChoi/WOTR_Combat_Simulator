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
import { pinName } from '../../components/apps/aoe4-build-order/pin-name'
import { clearStoredPin, readStoredPin, writeStoredPin } from '../../components/apps/aoe4-build-order/pin-storage'
import { ComparePanel } from '../../components/apps/aoe4-build-order/compare-panel'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { StepTable } from '../../components/apps/aoe4-build-order/step-table'
import { mergeExternalEdit } from '../../components/apps/aoe4-build-order/step-table-model'
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

export default function AoE4BuildOrder({ builds, catalog }: PageProps) {
    const router = useRouter()
    const [text, setText] = useState(builds[0]?.text ?? '')
    const [duration, setDuration] = useState(String(DEFAULT_DURATION_SECONDS))
    const [pin, setPin] = useState<Pin | null>(null)
    const [selected, setSelected] = useState(builds[0]?.name ?? '')
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [tab, setTab] = useState<WorkbenchTab>('build')
    const [view, setView] = useState<EditorView>('text')
    const [openRows, setOpenRows] = useState<boolean[]>([])
    const pinTouched = useRef(false)
    const pageSection = useRef<HTMLElement>(null)
    const runBar = useRef<HTMLFormElement>(null)
    const autoRun = useAutoRun({ text, duration, selected, catalog, hold: !router.isReady })
    const { status, conversion, result, shown } = autoRun
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
                    hasResult={result !== null}
                    onSubmit={() => autoRun.flush()}
                    view={view}
                    onViewChange={setView}
                    viewDisabled={!split && shownTab === 'results'}
                    formRef={runBar}
                />
                <WorkbenchTabs
                    active={shownTab}
                    onSelect={setTab}
                    resultsEnabled={resultsEnabled}
                    split={split}
                    build={
                        <>
                            {view === 'text' ? (
                                <BuildTextEditor text={text} onChange={editText} errorLines={issueLines(clientIssues)} />
                            ) : parsed.ok === true ? (
                                <StepTable
                                    order={parsed.order}
                                    catalog={catalog}
                                    onChange={(order) => setText(formatBuildOrderText(order))}
                                    openRows={openRows}
                                    onOpenRowsChange={setOpenRows}
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
