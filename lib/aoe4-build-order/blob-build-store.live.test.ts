// Opt-in check against a real Vercel Blob store: `vercel env pull .env.local`, then `npm run test:blob-live`.
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { BlobError, BlobNotFoundError, del, put } from '@vercel/blob'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createBlobBuildStore } from './blob-build-store'
import { namedBuildKey, newNamedBuildId } from './named-builds'

describe.skipIf(process.env.BLOB_LIVE !== '1')('Blob store against a real store', () => {
    const env = `live-check-${randomUUID()}`
    const probeKey = `${env}/probe.json`
    const namedId = newNamedBuildId()
    let storeId = ''

    beforeAll(() => {
        if (existsSync('.env.local')) process.loadEnvFile('.env.local')
        storeId = process.env.BUILDS_STORE_ID ?? ''
        if (storeId === '') throw new Error('BUILDS_STORE_ID is not set; run vercel env pull .env.local')
    })

    afterAll(async () => {
        if (storeId === '') return
        for (const key of [probeKey, namedBuildKey(env, namedId)]) {
            try {
                await del(key, { storeId })
            } catch (error) {
                if (!(error instanceof BlobNotFoundError)) throw error
            }
        }
    })

    it('records the error put raises for ifMatch on a missing key', async () => {
        const error = await put(probeKey, '{}', { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId, allowOverwrite: true, ifMatch: '"0"' }).then(
            () => null,
            (rejected: unknown) => rejected,
        )
        console.log(`put with ifMatch on a missing key raised ${error instanceof Error ? error.constructor.name : String(error)}`)
        expect((error as Error).constructor).toBe(BlobError)
    })

    it('reports a conflict for replaceNamed on a missing id and creates no blob', async () => {
        const blob = createBlobBuildStore(storeId, env)
        expect(await blob.replaceNamed(namedId, '{"v":1}', '"0"')).toBe('conflict')
        expect(await blob.getNamed(namedId)).toBeNull()
    })
})
