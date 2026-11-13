import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
    EXIT_FRESH,
    EXIT_STALE,
    EXIT_UNREACHABLE,
    checkFreshness,
    compareSnapshot,
} from '../../data/aoe4-build-order/check-freshness.mjs'
import { CIV, KINDS, REPO, filterEnglish, getJson } from '../../data/aoe4-build-order/snapshot-source.mjs'

type Entry = { id: string; civs: string[]; cost?: number }
type Kinds = Record<(typeof KINDS)[number], Entry[]>

const entry = (id: string, cost = 1): Entry => ({ id, civs: ['en'], cost })
const makeKinds = (): Kinds => ({
    units: [entry('a'), entry('b'), entry('c')],
    buildings: [entry('house'), entry('mill')],
    technologies: [entry('t1'), entry('t2')],
    upgrades: [entry('u1')],
})
const makeSnapshot = (kinds = makeKinds()) => ({
    source: { repo: REPO, commit: 'c'.repeat(40), fetchedAt: '2026-01-01T00:00:00Z' },
    ...kinds,
})

describe('compareSnapshot', () => {
    it('is fresh when every kind is equal', () => {
        expect(compareSnapshot(makeSnapshot(), makeKinds())).toEqual({ stale: false, differing: [] })
    })

    it.each(KINDS)('is stale naming %s when an entry is added, removed or changed there', (kind) => {
        const mutations: Record<string, (entries: Entry[]) => Entry[]> = {
            added: (entries) => [...entries, entry('new')],
            removed: (entries) => entries.slice(0, -1),
            changed: (entries) => entries.map((e, i) => (i === 0 ? { ...e, cost: 99 } : e)),
        }
        for (const [what, mutate] of Object.entries(mutations)) {
            const upstream = makeKinds()
            upstream[kind] = mutate(upstream[kind])
            const result = compareSnapshot(makeSnapshot(), upstream)
            expect(result.stale, `${kind} ${what}`).toBe(true)
            expect((result.differing as { kind: string }[]).map((d) => d.kind)).toEqual([kind])
        }
    })

    it('names the ids added, removed and changed', () => {
        const upstream = makeKinds()
        upstream.units = [entry('a', 5), entry('c'), entry('d')]
        const { differing } = compareSnapshot(makeSnapshot(), upstream)
        expect(differing).toEqual([
            { kind: 'units', committedCount: 3, upstreamCount: 3, added: ['d'], removed: ['b'], changed: ['a'] },
        ])
    })

    it('is stale when only the order of a kind changes', () => {
        const upstream = makeKinds()
        upstream.units = [...upstream.units].reverse()
        const { stale, differing } = compareSnapshot(makeSnapshot(), upstream)
        expect(stale).toBe(true)
        expect(differing[0]).toMatchObject({ kind: 'units', added: [], removed: [], changed: [] })
    })

    it('ignores source.fetchedAt and the pinned commit', () => {
        const snapshot = makeSnapshot()
        snapshot.source = { ...snapshot.source, fetchedAt: '2030-12-31T00:00:00Z', commit: 'd'.repeat(40) }
        expect(compareSnapshot(snapshot, makeKinds()).stale).toBe(false)
    })
})

const LATEST = 'f'.repeat(40)
type Call = { url: string; headers: Record<string, string> }

function fakeFetch(options: { kinds?: Kinds; headStatus?: number; failKind?: string; throwOn?: string } = {}) {
    const calls: Call[] = []
    const kinds = options.kinds ?? makeKinds()
    const impl = async (url: string, init: { headers: Record<string, string> }) => {
        calls.push({ url, headers: init.headers })
        if (options.throwOn && url.includes(options.throwOn)) {
            throw new TypeError('fetch failed')
        }
        const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
        if (url.endsWith('/commits/HEAD')) {
            return options.headStatus ? { ok: false, status: options.headStatus, json: async () => ({}) } : ok({ sha: LATEST })
        }
        const kind = KINDS.find((k) => url.endsWith(`/${k}/all.json`))
        if (kind === options.failKind) {
            return { ok: false, status: 404, json: async () => ({}) }
        }
        return ok({ data: [...kinds[kind as (typeof KINDS)[number]], { id: 'other-civ', civs: ['fr'] }] })
    }
    return { impl: impl as unknown as typeof fetch, calls }
}

describe('checkFreshness', () => {
    it('is fresh at a different upstream commit with identical English content, fetching at the returned sha', async () => {
        const { impl, calls } = fakeFetch()
        const result = await checkFreshness(makeSnapshot(), impl)
        expect(result.code).toBe(EXIT_FRESH)
        expect(result.message).toContain(LATEST)
        expect(calls[0].url).toBe(`https://api.github.com/repos/${REPO}/commits/HEAD`)
        const contentUrls = calls.slice(1).map((c) => c.url)
        expect(contentUrls).toEqual(
            KINDS.map((kind) => `https://raw.githubusercontent.com/${REPO}/${LATEST}/${kind}/all.json`),
        )
    })

    it('reports stale with the pinned and latest commits, the differing kind and the README pointer', async () => {
        const kinds = makeKinds()
        kinds.buildings = [entry('house')]
        const result = await checkFreshness(makeSnapshot(), fakeFetch({ kinds }).impl)
        expect(result.code).toBe(EXIT_STALE)
        expect(result.message).toContain('c'.repeat(40))
        expect(result.message).toContain(LATEST)
        expect(result.message).toContain('buildings: 2 committed, 1 upstream; removed: mill')
        expect(result.message).not.toContain('units:')
        expect(result.message).toContain('Refreshing the snapshot')
    })

    it.each([
        ['the latest-commit lookup answers non-OK', { headStatus: 403 }, 'HTTP 403'],
        ['a kind answers non-OK', { failKind: 'upgrades' }, 'HTTP 404'],
        ['the network fails', { throwOn: 'api.github.com' }, 'fetch failed'],
    ])('exits with the unreachable code, not fresh or stale, when %s', async (_name, options, text) => {
        const result = await checkFreshness(makeSnapshot(), fakeFetch(options).impl)
        expect(result.code).toBe(EXIT_UNREACHABLE)
        expect([EXIT_FRESH, EXIT_STALE]).not.toContain(result.code)
        expect(result.message).toContain('Could not check')
        expect(result.message).toContain(text)
    })
})

describe('snapshot-source', () => {
    it('keeps only entries whose civs include the snapshot civ', () => {
        expect(CIV).toBe('en')
        expect(filterEnglish([entry('a'), { id: 'b', civs: ['fr'] }, { id: 'c', civs: ['fr', 'en'] }]).map((e: Entry) => e.id)).toEqual([
            'a',
            'c',
        ])
    })

    it('getJson throws on a non-OK status and sends the token only to the GitHub API', async () => {
        const { impl, calls } = fakeFetch({ headStatus: 500 })
        await expect(getJson('https://api.github.com/repos/x/commits/HEAD', impl)).rejects.toThrow('HTTP 500')
        expect(calls[0].headers['User-Agent']).toBeTruthy()
        const saved = process.env.GITHUB_TOKEN
        process.env.GITHUB_TOKEN = 'secret'
        try {
            const api = fakeFetch()
            await getJson('https://api.github.com/repos/x/commits/HEAD', api.impl)
            await getJson(`https://raw.githubusercontent.com/${REPO}/${LATEST}/units/all.json`, api.impl)
            expect(api.calls[0].headers.Authorization).toBe('Bearer secret')
            expect(api.calls[1].headers.Authorization).toBeUndefined()
        } finally {
            if (saved === undefined) delete process.env.GITHUB_TOKEN
            else process.env.GITHUB_TOKEN = saved
        }
    })
})

describe('data scripts structure', () => {
    const read = (name: string) => readFileSync(new URL(`../../data/aoe4-build-order/${name}`, import.meta.url), 'utf8')

    it.each(['check-freshness.mjs', 'snapshot-source.mjs'])('%s makes no file writes', (name) => {
        expect(read(name)).not.toMatch(/writeFile|appendFile|createWriteStream|rmSync|unlinkSync|mkdirSync/)
    })

    it.each(['check-freshness.mjs', 'refresh-snapshot.mjs'])('%s imports the shared source instead of defining it', (name) => {
        const source = read(name)
        expect(source).toContain("from './snapshot-source.mjs'")
        expect(source).not.toMatch(/'aoe4world\/data'|const (KINDS|CIV|REPO)\b|function (getJson|filterEnglish)/)
    })
})
