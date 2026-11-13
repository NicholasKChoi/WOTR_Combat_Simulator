// Upstream source of the English snapshot, shared by refresh-snapshot.mjs and check-freshness.mjs.
// Not imported by the app. Importing it has no side effects.

export const REPO = 'aoe4world/data'
export const KINDS = ['units', 'buildings', 'technologies', 'upgrades']
export const CIV = 'en'

export function filterEnglish(entries) {
    return entries.filter((entry) => entry.civs.includes(CIV))
}

export async function getJson(url, fetchImpl = fetch) {
    const headers = { 'User-Agent': 'aoe4-snapshot' }
    if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com/')) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    }
    const response = await fetchImpl(url, { headers })
    if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`)
    }
    return response.json()
}

export function rawKindUrl(commit, kind) {
    return `https://raw.githubusercontent.com/${REPO}/${commit}/${kind}/all.json`
}
