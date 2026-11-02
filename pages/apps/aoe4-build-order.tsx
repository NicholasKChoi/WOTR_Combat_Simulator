import utilStyles from '../../styles/utils.module.css'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import cn from 'classnames'

import Layout from '../../components/layout'
import { BuildInput, type EditorView, type PrebuiltBuild } from '../../components/apps/aoe4-build-order/build-input'
import { BuildTextEditor } from '../../components/apps/aoe4-build-order/build-text-editor'
import { IssueList } from '../../components/apps/aoe4-build-order/issue-list'
import { ComparePanel } from '../../components/apps/aoe4-build-order/compare-panel'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { StepTable } from '../../components/apps/aoe4-build-order/step-table'
import { WorkbenchTabs, type WorkbenchTab } from '../../components/apps/aoe4-build-order/workbench-tabs'
import workbenchStyles from '../../components/apps/aoe4-build-order/workbench.module.css'
import { listBuilds } from '../../lib/aoe4-build-order/builds'
import { loadGameData } from '../../lib/aoe4-build-order/data'
import { formatBuildOrderText, parseBuildOrderText } from '../../lib/aoe4-build-order/parse-text'
import type { BuildOrderIssue } from '../../lib/aoe4-build-order/model'
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
    const [resultText, setResultText] = useState('')
    const [pinned, setPinned] = useState<SimulateResponse | null>(null)
    const [issues, setIssues] = useState<string[]>([])
    const [clientIssues, setClientIssues] = useState<BuildOrderIssue[]>([])
    const [running, setRunning] = useState(false)
    const [infoExpanded, setInfoExpanded] = useState(false)
    const [tab, setTab] = useState<WorkbenchTab>('build')
    const [view, setView] = useState<EditorView>('text')
    const [resultsShownCount, setResultsShownCount] = useState(0)
    const resultsTop = useRef<HTMLDivElement>(null)
    const resultsEnabled = result !== null || pinned !== null
    const shownTab = resultsEnabled ? tab : 'build'
    const parsed = useMemo(() => parseBuildOrderText(text), [text])

    useEffect(() => {
        if (resultsShownCount > 0) resultsTop.current?.scrollIntoView()
    }, [resultsShownCount])

    async function runSimulation() {
        setIssues([])
        setClientIssues([])
        const runText = text
        const converted = textToBuildOrder(runText, catalog)
        if (converted.ok === false) {
            setClientIssues(converted.issues)
            setResult(null)
            setTab('build')
            return
        }
        setRunning(true)
        const request: SimulateRequest = { buildOrder: converted.order, inputs: { durationSeconds: Number(duration) } }
        try {
            const response = await fetch('/api/aoe4-build-order/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(request),
            })
            if (!response.ok) {
                setResult(null)
                setTab('build')
                setIssues(await errorMessages(response))
                return
            }
            const body: SimulateResponse = await response.json()
            setResult(body)
            setResultText(runText)
            setTab('results')
            setResultsShownCount((n) => n + 1)
        } catch {
            setResult(null)
            setTab('build')
            setIssues(['The simulation could not be run. Please try again.'])
        } finally {
            setRunning(false)
        }
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
                    onTextChange={setText}
                    duration={duration}
                    onDurationChange={setDuration}
                    running={running}
                    onRun={runSimulation}
                    view={view}
                    onViewChange={setView}
                />
                <WorkbenchTabs
                    active={shownTab}
                    onSelect={setTab}
                    resultsEnabled={resultsEnabled}
                    build={
                        <>
                            {view === 'text' ? (
                                <BuildTextEditor text={text} onChange={setText} />
                            ) : parsed.ok === true ? (
                                <StepTable order={parsed.order} catalog={catalog} onChange={(order) => setText(formatBuildOrderText(order))} />
                            ) : (
                                <div data-testid="step-table-unavailable" className="alert alert-secondary">
                                    {parsed.issues[0].message}
                                </div>
                            )}
                            <IssueList issues={clientIssues} />
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
                        <div ref={resultsTop} className={workbenchStyles.panel}>
                            <h2 className="border-bottom">Results</h2>
                            <ComparePanel current={result} pinned={pinned} onPin={() => setPinned(result)} onUnpin={() => setPinned(null)} />
                            {result !== null ? (
                                <Results
                                    result={result}
                                    pinned={pinned}
                                    text={resultText}
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
