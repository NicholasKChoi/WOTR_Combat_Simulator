import utilStyles from '../../styles/utils.module.css'

import { useState } from 'react'
import type { GetStaticProps } from 'next'
import Head from 'next/head'
import cn from 'classnames'

import Layout from '../../components/layout'
import { BuildInput, type PrebuiltBuild } from '../../components/apps/aoe4-build-order/build-input'
import { Results } from '../../components/apps/aoe4-build-order/results'
import { listBuilds } from '../../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../../lib/aoe4-build-order/parse-text'
import type { SimulateError, SimulateRequest, SimulateResponse } from '../../lib/aoe4-build-order/api'

const pageTitle = 'AoE4 Build Order Simulator'
const DEFAULT_DURATION_SECONDS = 1200

interface PageProps {
    builds: PrebuiltBuild[]
}

export const getStaticProps: GetStaticProps<PageProps> = async () => ({
    props: { builds: listBuilds().map((order) => ({ name: order.name, text: formatBuildOrderText(order) })) },
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

export default function AoE4BuildOrder({ builds }: PageProps) {
    const [text, setText] = useState(builds[0]?.text ?? '')
    const [duration, setDuration] = useState(String(DEFAULT_DURATION_SECONDS))
    const [result, setResult] = useState<SimulateResponse | null>(null)
    const [issues, setIssues] = useState<string[]>([])
    const [running, setRunning] = useState(false)

    async function runSimulation() {
        setRunning(true)
        setIssues([])
        const request: SimulateRequest = { text, inputs: { durationSeconds: Number(duration) } }
        try {
            const response = await fetch('/api/aoe4-build-order/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(request),
            })
            if (!response.ok) {
                setResult(null)
                setIssues(await errorMessages(response))
                return
            }
            setResult(await response.json())
        } catch {
            setResult(null)
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
                    text={text}
                    onTextChange={setText}
                    duration={duration}
                    onDurationChange={setDuration}
                    running={running}
                    onRun={runSimulation}
                />
                {issues.length > 0 ? (
                    <div data-testid="simulation-error" role="alert" className="alert alert-danger">
                        <ul className="mb-0">
                            {issues.map((message, i) => (
                                <li key={i}>{message}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                <h2 className="border-bottom">Results</h2>
                {result !== null ? <Results result={result} /> : null}
            </section>
        </Layout>
    )
}
