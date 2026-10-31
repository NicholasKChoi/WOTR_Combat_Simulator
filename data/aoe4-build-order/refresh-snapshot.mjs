// Usage: node data/aoe4-build-order/refresh-snapshot.mjs <commit-sha> <patch> <patch-source-url>
// Writes aoe4world/english.json from aoe4world/data at <commit-sha>. Not imported by the app.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = 'aoe4world/data'
const KINDS = ['units', 'buildings', 'technologies', 'upgrades']
const CIV = 'en'

const [commit, patch, patchSource] = process.argv.slice(2)
if (!/^[0-9a-f]{40}$/.test(commit ?? '') || !patch || !patchSource?.startsWith('http')) {
    console.error('usage: refresh-snapshot.mjs <40-char commit sha> <patch> <patch-source-url>')
    process.exit(1)
}

async function getJson(url) {
    const response = await fetch(url, { headers: { 'User-Agent': 'refresh-snapshot' } })
    if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`)
    }
    return response.json()
}

const { commit: meta } = await getJson(`https://api.github.com/repos/${REPO}/commits/${commit}`)
const snapshot = {
    source: {
        repo: REPO,
        commit,
        committedAt: meta.committer.date,
        fetchedAt: new Date().toISOString(),
        patch,
        patchSource,
    },
}
for (const kind of KINDS) {
    const { data } = await getJson(`https://raw.githubusercontent.com/${REPO}/${commit}/${kind}/all.json`)
    snapshot[kind] = data.filter((entry) => entry.civs.includes(CIV))
}

const out = join(dirname(fileURLToPath(import.meta.url)), 'aoe4world', 'english.json')
writeFileSync(out, JSON.stringify(snapshot, null, 2) + '\n')
console.log(`wrote ${out}: ${KINDS.map((kind) => `${snapshot[kind].length} ${kind}`).join(', ')}`)
