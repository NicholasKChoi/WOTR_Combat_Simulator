import { describe, expect, it } from 'vitest'
import { MAX_REPORTED_ISSUES } from './api'
import { isPlainObject, issuesError, methodNotAllowed, notAnObjectError, sendReply } from './api-route'
import type { BuildOrderIssue } from './model'
import { recordingTarget } from './route-test-support'

describe('methodNotAllowed', () => {
    it.each([
        ['GET', ['POST'], 'POST', 'method GET is not allowed; use POST'],
        ['PUT', ['GET', 'DELETE'], 'GET, DELETE', 'method PUT is not allowed; use GET or DELETE'],
        ['DELETE', ['GET'], 'GET', 'method DELETE is not allowed; use GET'],
        [undefined, ['POST'], 'POST', 'method undefined is not allowed; use POST'],
    ])('answers %s with allow %j', (method, allowed, header, error) => {
        expect(methodNotAllowed(method, allowed)).toStrictEqual({ status: 405, headers: { Allow: header }, body: { error } })
    })
})

describe('notAnObjectError', () => {
    it('is the body the simulate route has always answered for a body that is not an object', () => {
        expect(notAnObjectError()).toStrictEqual({
            error: 'request body: must be a JSON object',
            issues: [{ code: 'syntax', message: 'request body: must be a JSON object' }],
        })
    })
})

describe('isPlainObject', () => {
    it.each([
        [{}, true],
        [{ a: 1 }, true],
        [[], false],
        [null, false],
        ['text', false],
        [3, false],
        [undefined, false],
    ])('%j is %s', (value, expected) => {
        expect(isPlainObject(value)).toBe(expected)
    })
})

describe('issuesError', () => {
    const issues = (count: number): BuildOrderIssue[] => Array.from({ length: count }, (_, index) => ({ code: 'invalid', message: `issue ${index}` }))

    it.each([
        [1, 1, undefined],
        [MAX_REPORTED_ISSUES, MAX_REPORTED_ISSUES, undefined],
        [MAX_REPORTED_ISSUES + 1, MAX_REPORTED_ISSUES, 1],
    ])('reports %i issues as %i with omittedIssues %s', (count, reported, omitted) => {
        const all = issues(count)
        const error = issuesError(all)
        expect(error.issues).toStrictEqual(all.slice(0, reported))
        expect(error.omittedIssues).toBe(omitted)
        expect('omittedIssues' in error).toBe(omitted !== undefined)
    })

    it('uses the first issue message as the error', () => {
        expect(issuesError([{ code: 'syntax', message: 'first' }, { code: 'invalid', message: 'second' }]).error).toBe('first')
    })
})

describe('sendReply', () => {
    it('sets the status, then each header, then sends the body as json once and never ends', () => {
        const { target, calls } = recordingTarget()
        sendReply(target, { status: 201, headers: { A: '1', B: '2' }, body: { id: 'x' } })
        expect(calls).toStrictEqual(['status 201', 'header A=1', 'header B=2', 'json {"id":"x"}'])
        expect(target.end).not.toHaveBeenCalled()
    })

    it('ends once and never sends json when there is no body', () => {
        const { target, calls } = recordingTarget()
        sendReply(target, { status: 204 })
        expect(calls).toStrictEqual(['status 204', 'end'])
        expect(target.json).not.toHaveBeenCalled()
    })

    it('sends a falsy body that is not undefined as json', () => {
        const { target } = recordingTarget()
        sendReply(target, { status: 200, body: null })
        expect(target.json).toHaveBeenCalledWith(null)
        expect(target.end).not.toHaveBeenCalled()
    })
})
