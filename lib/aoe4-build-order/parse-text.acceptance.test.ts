import { describe, expect, it } from 'vitest'
import type { BuildOrder } from './model'
import { formatBuildOrderText, parseBuildOrderText } from './parse-text'

function parseOk(text: string) {
    const result = parseBuildOrderText(text)
    if (result.ok === false) {
        throw new Error(`expected ok, got ${JSON.stringify(result.issues)}`)
    }
    return result
}

function syntaxLines(text: string): number[] {
    const result = parseBuildOrderText(text)
    if (result.ok !== false) {
        throw new Error(`expected syntax issues for ${JSON.stringify(text)}`)
    }
    for (const issue of result.issues) {
        expect(issue.code).toBe('syntax')
        expect(issue.step).toBeUndefined()
        expect(typeof issue.message).toBe('string')
    }
    return result.issues.map((issue) => issue.line as number)
}

describe('parseBuildOrderText grammar', () => {
    it('maps every action with all suffixes and both trigger kinds onto steps', () => {
        const { order } = parseOk(
            [
                '@1:05 produce villager from capital-town-center#2 x3 -> wood walk 4s',
                'at 12 vils pause capital-town-center#2',
                'build house with 2 from wood then gold walk 3s',
                'research wheelbarrow at capital-town-center',
                'research fervent',
                'move 4 sheep to berry walk 2s',
                'rally capital-town-center -> farm walk 1s',
            ].join('\n'),
        )
        expect(order.steps).toEqual([
            { trigger: { kind: 'time', seconds: 65 }, action: 'produce', unit: 'villager', producer: 'capital-town-center', instance: 2, count: 3, rally: 'wood', walkSeconds: 4 },
            { trigger: { kind: 'villagers', count: 12 }, action: 'pause', producer: 'capital-town-center', instance: 2 },
            { action: 'build', building: 'house', builders: 2, from: 'wood', then: 'gold', walkSeconds: 3 },
            { action: 'research', tech: 'wheelbarrow', at: 'capital-town-center' },
            { action: 'research', tech: 'fervent' },
            { action: 'move', count: 4, from: 'sheep', to: 'berry', walkSeconds: 2 },
            { action: 'rally', producer: 'capital-town-center', to: 'farm', walkSeconds: 1 },
        ])
    })

    it('sets civ, name and no source key, even for empty text', () => {
        for (const text of ['', '# only a comment\n\n']) {
            const { order, lines } = parseOk(text)
            expect(order.civ).toBe('english')
            expect(order.name).toBe('Pasted build order')
            expect('source' in order).toBe(false)
            expect('start' in order).toBe(false)
            expect(order.steps).toEqual([])
            expect(lines).toEqual({ steps: [] })
        }
    })

    it('treats #k inside a line as an instance and only a leading # as a comment', () => {
        const { order } = parseOk('   # indented comment\npause tc#3')
        expect(order.steps).toEqual([{ action: 'pause', producer: 'tc', instance: 3 }])
    })

    it('parses @60:00 and @75:00 but rejects @1:61', () => {
        expect(parseOk('@60:00 pause tc').order.steps[0].trigger).toEqual({ kind: 'time', seconds: 3600 })
        expect(parseOk('@75:00 pause tc').order.steps[0].trigger).toEqual({ kind: 'time', seconds: 4500 })
        expect(syntaxLines('@1:61 pause tc')).toEqual([1])
    })

    it.each([
        ['unknown prefix word', 'soon pause tc'],
        ['unknown action', 'dance tc'],
        ['produce suffixes out of order', 'produce villager from tc walk 4s x3'],
        ['walk with a space', 'produce villager from tc -> wood walk 4 s'],
        ['walk with a decimal', 'produce villager from tc -> wood walk 4.5s'],
        ['uppercase id', 'produce Villager from tc'],
        ['negative number', 'move -2 sheep to wood'],
        ['decimal number', 'move 2.5 sheep to wood'],
        ['missing from', 'produce villager tc'],
        ['rally without target', 'rally tc ->'],
        ['rally without arrow', 'rally tc wood'],
        ['trailing tokens', 'pause tc extra'],
        ['walk on a pause', 'pause tc walk 2s'],
        ['non-numeric instance', 'pause tc#a'],
        ['bare at without vils', 'at 5 pause tc'],
        ['trigger with no action', '@0:10'],
    ])('rejects %s with one syntax issue on that line', (_name, line) => {
        expect(syntaxLines(`pause tc\n${line}`)).toEqual([2])
    })

    it('reports one issue per bad line in line order across CRLF, blanks and comments', () => {
        expect(syntaxLines('pause tc\r\n\r\n# c\r\nbogus\r\n  \r\nproduce x\r\npause tc')).toEqual([4, 6])
    })

    it('puts each step on its physical line across CRLF, blanks and comments', () => {
        const { lines, order } = parseOk('\r\n# c\r\n@0:10 pause tc\r\n\r\nresearch fervent\r\n')
        expect(lines).toEqual({ steps: [3, 5] })
        expect(lines.steps.length).toBe(order.steps.length)
    })

    it('matches the design line-map examples', () => {
        expect(parseOk('start 6 sheep -> sheep\n# opener\n@0:00 produce villager from capital-town-center x3').lines).toEqual({ start: 1, steps: [3] })
        expect(parseOk('pause a\npause b\npause c\npause d\npause e').lines).toEqual({ steps: [1, 2, 3, 4, 5] })
    })

    it('does no id, bound or cross-field checks', () => {
        const { order } = parseOk('produce villager from capital-town-center -> nowhere walk 4s\n@75:00 produce villager from nowhere x999\nproduce villager from tc x0')
        expect(order.steps[0]).toMatchObject({ rally: 'nowhere', walkSeconds: 4 })
        expect(order.steps[1]).toMatchObject({ producer: 'nowhere', count: 999 })
        expect(order.steps[2]).toMatchObject({ count: 0 })
    })

    it('does not lowercase ids', () => {
        expect(syntaxLines('research Fervent')).toEqual([1])
    })
})

describe('parseBuildOrderText start line', () => {
    it('parses villagers and rally, villagers only, and rally only', () => {
        expect(parseOk('start 4 sheep 2 wood -> sheep').order.start).toEqual({ villagers: { sheep: 4, wood: 2 }, rally: 'sheep' })
        expect(parseOk('start -> sheep').order.start).toEqual({ rally: 'sheep' })
        expect(parseOk('start 6 sheep').order.start).toEqual({ villagers: { sheep: 6 } })
    })

    it.each([
        ['alone', 'start', [1]],
        ['repeated node', 'start 2 sheep 3 sheep', [1]],
        ['with trailing tokens', 'start 2 sheep extra', [1]],
        ['with a trigger', '@0:00 start 6 sheep', [1]],
        ['with a vils trigger', 'at 3 vils start 6 sheep', [1]],
        ['second start', 'start 6 sheep\nstart 2 wood', [2]],
        ['after a step', 'pause tc\nstart 6 sheep', [2]],
    ])('rejects start %s', (_name, text, lines) => {
        expect(syntaxLines(text)).toEqual(lines)
    })

    it('rejects a start after a step even when that step line was itself bad', () => {
        expect(syntaxLines('bogus\nstart 6 sheep')).toEqual([1, 2])
    })
})

describe('parseBuildOrderText performance', () => {
    it('parses 20,000 characters of valid lines and of one non-matching line quickly', () => {
        const many = 'at 10 vils produce villager from capital-town-center x3 -> wood walk 4s\n'.repeat(280)
        const long = 'a'.repeat(20000)
        const started = performance.now()
        expect(parseOk(many.slice(0, 20000)).order.steps.length).toBeGreaterThan(0)
        expect(parseBuildOrderText(long).ok).toBe(false)
        expect(parseBuildOrderText(`produce ${'a-'.repeat(10000)}`).ok).toBe(false)
        expect(parseBuildOrderText(`pause ${'a'.repeat(10000)}#${'1'.repeat(9000)}x`).ok).toBe(false)
        expect(performance.now() - started).toBeLessThan(100)
    })
})

describe('formatBuildOrderText', () => {
    const full: BuildOrder = {
        civ: 'english',
        name: 'n',
        start: { villagers: { wood: 2, sheep: 4 }, rally: 'sheep' },
        steps: [
            { trigger: { kind: 'time', seconds: 3605 }, action: 'produce', unit: 'villager', producer: 'tc', instance: 2, count: 3, rally: 'wood', walkSeconds: 4 },
            { trigger: { kind: 'villagers', count: 12 }, action: 'pause', producer: 'tc', instance: 1 },
            { action: 'build', building: 'house', builders: 2, from: 'wood', then: 'gold', walkSeconds: 3 },
            { action: 'build', building: 'house', from: 'wood' },
            { action: 'research', tech: 'wheelbarrow', at: 'tc' },
            { action: 'research', tech: 'fervent' },
            { action: 'move', count: 4, from: 'sheep', to: 'berry', walkSeconds: 0 },
            { trigger: { kind: 'time', seconds: 0 }, action: 'rally', producer: 'tc', to: 'farm' },
            { action: 'produce', unit: 'villager', producer: 'tc' },
        ],
    }

    it('round-trips start and steps for a paste-representable order using every action', () => {
        const text = formatBuildOrderText(full)
        const result = parseOk(text)
        expect(result.order.start).toEqual(full.start)
        expect(result.order.steps).toEqual(full.steps)
        expect(text).toContain('@60:05 ')
        expect(text).toContain('@0:00 rally')
    })

    it('emits start first with villagers in node order whatever the key order', () => {
        const text = formatBuildOrderText({ ...full, start: { rally: 'wood', villagers: { stone: 1, wood: 2, farm: 3, sheep: 4, berry: 5 } } })
        expect(text.split('\n')[0]).toBe('start 4 sheep 5 berry 3 farm 2 wood 1 stone -> wood')
    })

    it('omits start when it is absent or empty and emits no comments or metadata', () => {
        for (const start of [undefined, {}, { villagers: {} }]) {
            const text = formatBuildOrderText({ civ: 'english', name: 'SECRET', source: 'SRC', start, steps: [{ action: 'pause', producer: 'tc' }] })
            expect(text).toBe('pause tc')
        }
        expect(formatBuildOrderText({ civ: 'english', name: 'SECRET', source: 'SRC', steps: [] })).toBe('')
    })

    it('prints a decimal walkSeconds without throwing and the result re-parses as syntax', () => {
        const text = formatBuildOrderText({ civ: 'english', name: 'n', steps: [{ action: 'pause', producer: 'tc' }, { action: 'move', count: 1, from: 'sheep', to: 'wood', walkSeconds: 4.5 }] })
        expect(text).toContain('walk 4.5s')
        expect(syntaxLines(text)).toEqual([2])
    })
})
