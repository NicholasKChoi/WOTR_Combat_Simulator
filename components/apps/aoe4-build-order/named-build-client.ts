import { z } from 'zod'
import {
    isNamedBuildId,
    NAMED_BUILD_ID_PATTERN,
    revisionEtag,
    storedNamedBuildSchema,
    type CreateNamedBuildResponse,
    type NamedBuild,
    type UpdateNamedBuildResponse,
} from '../../../lib/aoe4-build-order/named-builds'
import type { SaveBuildRequest } from '../../../lib/aoe4-build-order/saved-builds'
import { loadJson, sendJson, type JsonReply } from './build-fetch'
import { saveFailureMessage } from './save-build-client'

const NAMED_BUILDS_PATH = '/api/aoe4-build-order/named-builds'

export type NamedSaveFailure = { ok: false; kind: 'conflict' | 'forbidden' | 'not-found' | 'other'; message: string }

const namedBuildBodySchema = storedNamedBuildSchema.omit({ secretHash: true }).extend({ id: z.string().regex(NAMED_BUILD_ID_PATTERN) })

function hasStrings(body: unknown, keys: readonly string[]): body is Record<string, unknown> {
    if (typeof body !== 'object' || body === null) return false
    const record = body as Record<string, unknown>
    return keys.every((key) => typeof record[key] === 'string')
}

function isCreateResponse(body: unknown): body is CreateNamedBuildResponse {
    return hasStrings(body, ['id', 'path', 'editSecret', 'updatedAt']) && body.revision === 1
}

function isUpdateResponse(body: unknown): body is UpdateNamedBuildResponse {
    return hasStrings(body, ['id', 'path', 'updatedAt']) && typeof body.revision === 'number'
}

const FAILURE_TEXT = {
    conflict: 'This build changed somewhere else. Choose it again to get the latest version, or save a copy.',
    forbidden: 'You cannot edit this build here. Save a copy instead.',
    'not-found': 'This build no longer exists. Save a copy instead.',
} as const

function failureOf(reply: JsonReply): NamedSaveFailure {
    switch (reply.status) {
        case 412:
            return { ok: false, kind: 'conflict', message: FAILURE_TEXT.conflict }
        case 401:
        case 403:
            return { ok: false, kind: 'forbidden', message: FAILURE_TEXT.forbidden }
        case 404:
            return { ok: false, kind: 'not-found', message: FAILURE_TEXT['not-found'] }
        default:
            return { ok: false, kind: 'other', message: saveFailureMessage(reply.status, reply.retryAfter, reply.body) }
    }
}

export async function createNamedBuild(
    request: SaveBuildRequest,
    signal?: AbortSignal,
): Promise<{ ok: true; response: CreateNamedBuildResponse } | NamedSaveFailure> {
    const reply = await sendJson(NAMED_BUILDS_PATH, { method: 'POST', body: request }, signal)
    return reply.status === 201 && isCreateResponse(reply.body) ? { ok: true, response: reply.body } : failureOf(reply)
}

export async function updateNamedBuild(
    id: string,
    editSecret: string,
    revision: number,
    request: SaveBuildRequest,
    signal?: AbortSignal,
): Promise<{ ok: true; response: UpdateNamedBuildResponse } | NamedSaveFailure> {
    const headers = { Authorization: `Bearer ${editSecret}`, 'If-Match': revisionEtag(revision) }
    const reply = await sendJson(`${NAMED_BUILDS_PATH}/${id}`, { method: 'PUT', headers, body: request }, signal)
    return reply.status === 200 && isUpdateResponse(reply.body) ? { ok: true, response: reply.body } : failureOf(reply)
}

export async function loadNamedBuild(
    id: string,
    signal: AbortSignal,
): Promise<{ status: 'ok'; build: NamedBuild } | { status: 'not-found' } | { status: 'failed' }> {
    if (!isNamedBuildId(id)) return { status: 'not-found' }
    const result = await loadJson(`${NAMED_BUILDS_PATH}/${id}`, namedBuildBodySchema, signal)
    return result.status === 'ok' ? { status: 'ok', build: result.value } : result
}
