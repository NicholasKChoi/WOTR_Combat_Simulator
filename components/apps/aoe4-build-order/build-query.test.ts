import { describe, expect, it } from 'vitest'
import type { ParsedUrlQuery } from 'querystring'
import { initialBuildQuery, nextBuildQuery } from './build-query'

describe('initialBuildQuery', () => {
    it.each([
        [{ n: 'x' }, { kind: 'named', id: 'x' }],
        [{ b: 'y' }, { kind: 'link', id: 'y' }],
        [{ n: 'x', b: 'y' }, { kind: 'named', id: 'x' }],
        [{ n: '', b: 'y' }, { kind: 'link', id: 'y' }],
        [{ n: ['p', 'q'] }, { kind: 'named', id: 'p' }],
        [{}, { kind: 'none' }],
        [{ n: '', b: '' }, { kind: 'none' }],
        [{ n: '!' }, { kind: 'named', id: '!' }],
    ] as [ParsedUrlQuery, unknown][])('reads %j as %j', (query, expected) => {
        expect(initialBuildQuery(query)).toEqual(expected)
    })
})

describe('nextBuildQuery', () => {
    it.each([
        ['a mine entry', { x: '1', b: 'abc' }, { kind: 'mine', id: 'Q1' }, { x: '1', n: 'Q1' }],
        ['a link entry', { n: 'old', b: 'old2', utm: 'a' }, { kind: 'link', id: 'z' }, { utm: 'a', b: 'z' }],
        ['a template entry', { n: 'old', b: 'old2', utm: 'a' }, { kind: 'template', id: null }, { utm: 'a' }],
        ['a shared entry', { b: 'old2' }, { kind: 'shared', id: 's' }, { n: 's' }],
        ['an array value on another key', { tag: ['a', 'b'] }, { kind: 'mine', id: 'm' }, { tag: ['a', 'b'], n: 'm' }],
        ['an entry with a null id', { n: 'old', k: 'v' }, { kind: 'mine', id: null }, { k: 'v' }],
    ] as const)('%s', (_label, query, entry, expected) => {
        expect(nextBuildQuery(query as ParsedUrlQuery, entry)).toStrictEqual(expected)
    })

    it('does not mutate its argument and returns a new object', () => {
        const query: ParsedUrlQuery = { n: 'old', k: 'v' }
        const next = nextBuildQuery(query, { kind: 'link', id: 'z' })
        expect(query).toEqual({ n: 'old', k: 'v' })
        expect(next).not.toBe(query)
    })

    it('never writes an undefined value', () => {
        expect(nextBuildQuery({ k: undefined, j: 'v' }, { kind: 'template', id: null })).toStrictEqual({ j: 'v' })
    })
})
