import { describe, expect, it } from 'vitest'
import type { BuildOrder, BuildOrderIssue, BuildStep } from './model'
import { formatBuildOrderText, formatBuildStep, parseBuildOrderText } from './parse-text'
import { buildOrderCatalog, checkBuildOrder } from './schema'
import { ENGLISH } from './test-helpers'

function parsed(text: string) {
    const result = parseBuildOrderText(text)
    if (result.ok === false) {
        throw new Error(`expected ok, got ${JSON.stringify(result.issues)}`)
    }
    return result
}

function issues(text: string): BuildOrderIssue[] {
    const result = parseBuildOrderText(text)
    if (result.ok === true) {
        throw new Error(`expected issues, got ${JSON.stringify(result.order)}`)
    }
    return result.issues
}

function onlyIssue(text: string): BuildOrderIssue {
    const found = issues(text)
    expect(found).toHaveLength(1)
    return found[0]
}

function step(text: string) {
    return parsed(text).order.steps[0]
}

function validationCode(text: string): string | undefined {
    const result = checkBuildOrder(parsed(`start -> sheep\n${text}`).order, buildOrderCatalog(ENGLISH))
    return result.ok === false ? result.issues[0].code : undefined
}

const representable: BuildOrder = {
    civ: 'english',
    name: 'Every action',
    start: { villagers: { sheep: 4, wood: 2, 'gold#2': 1 }, rally: 'sheep' },
    steps: [
        { action: 'produce', unit: 'villager', producer: 'capital-town-center', count: 3, rally: 'sheep', walkSeconds: 4 },
        { action: 'produce', unit: 'villager', producer: 'capital-town-center', rally: 'gold#3' },
        { action: 'build', building: 'mining-camp', from: 'wood', then: 'gold#2' },
        { trigger: { kind: 'depleted', node: 'berry' }, action: 'move', count: 6, from: 'berry', to: 'farm' },
        { trigger: { kind: 'depleted', node: 'gold' }, reaction: true, action: 'move', count: 'all', from: 'gold', to: 'gold#2', walkSeconds: 2 },
        { trigger: { kind: 'bank', resource: 'wood', atLeast: 400 }, action: 'build', building: 'lumber-camp', from: 'wood' },
        { trigger: { kind: 'depleted', node: 'gold#2' }, reaction: true, action: 'rally', producer: 'capital-town-center', to: 'gold#4' },
        { trigger: { kind: 'time', seconds: 45 }, action: 'build', building: 'house', builders: 2, from: 'wood', then: 'wood', walkSeconds: 6 },
        { trigger: { kind: 'villagers', count: 9 }, action: 'build', building: 'mill', from: 'sheep', then: 'berry' },
        { action: 'build', building: 'house', from: 'wood' },
        { action: 'research', tech: 'wheelbarrow', at: 'mill' },
        { action: 'research', tech: 'veteran-longbowmen' },
        { action: 'move', count: 3, from: 'sheep', to: 'berry', walkSeconds: 5 },
        { action: 'move', count: 0, from: 'gold', to: 'stone' },
        { trigger: { kind: 'time', seconds: 3600 }, action: 'produce', unit: 'longbowman', producer: 'archery-range', instance: 1, count: 5 },
        { action: 'produce', unit: 'villager', producer: 'capital-town-center', instance: 0 },
        { action: 'produce', unit: 'villager', producer: 'capital-town-center', walkSeconds: 4 },
        { action: 'pause', producer: 'capital-town-center', instance: 1 },
        { action: 'pause', producer: 'capital-town-center' },
        { action: 'rally', producer: 'capital-town-center', instance: 1, to: 'wood', walkSeconds: 3 },
        { trigger: { kind: 'villagers', count: 0 }, action: 'rally', producer: 'kings-palace', to: 'farm' },
    ],
}

describe('round trip', () => {
    it('re-parses a paste-representable order to equal start and steps', () => {
        const result = parsed(formatBuildOrderText(representable))
        expect(result.order.start).toStrictEqual(representable.start)
        expect(result.order.steps).toStrictEqual(representable.steps)
    })
})

describe('order metadata', () => {
    it.each(['', '# only a comment\n\n', 'start -> sheep', 'pause capital-town-center'])('is fixed for %j', (text) => {
        const { order } = parsed(text)
        expect(order.civ).toBe('english')
        expect(order.name).toBe('Pasted build order')
        expect('source' in order).toBe(false)
    })

    it('treats empty and comment-only text as no steps and no start', () => {
        for (const text of ['', '  \n\t\n# c\n   # indented comment']) {
            const result = parsed(text)
            expect(result.order.steps).toEqual([])
            expect('start' in result.order).toBe(false)
            expect(result.lines).toStrictEqual({ steps: [] })
        }
    })
})

describe('line map', () => {
    it('matches the design example with a start line', () => {
        const result = parsed('start 6 sheep -> sheep\n# opener\n@0:00 produce villager from capital-town-center x3')
        expect(result.lines).toStrictEqual({ start: 1, steps: [3] })
        expect(result.order.start).toStrictEqual({ villagers: { sheep: 6 }, rally: 'sheep' })
        expect(result.order.steps).toStrictEqual([
            { trigger: { kind: 'time', seconds: 0 }, action: 'produce', unit: 'villager', producer: 'capital-town-center', count: 3 },
        ])
    })

    it('matches the design example without a start line', () => {
        const text = ['pause a', 'pause b', 'pause c', 'pause d', 'pause e'].join('\n')
        const result = parsed(text)
        expect(result.lines).toStrictEqual({ steps: [1, 2, 3, 4, 5] })
        expect('start' in result.lines).toBe(false)
        expect('start' in result.order).toBe(false)
    })

    it('counts physical lines across CRLF, blanks, comments and indentation', () => {
        const text = '# header\r\n\r\npause a\r\n  \t\r\n\tresearch wheelbarrow\r\n#k comment\r\n  move 1 sheep to wood  \r\n'
        const result = parsed(text)
        expect(result.lines.steps).toEqual([3, 5, 7])
        expect(result.order.steps).toHaveLength(3)
        expect(result.order.steps[2]).toStrictEqual({ action: 'move', count: 1, from: 'sheep', to: 'wood' })
    })

    it('splits tokens on runs of spaces and tabs', () => {
        expect(step('produce \t villager   from\tcapital-town-center x2')).toStrictEqual({
            action: 'produce',
            unit: 'villager',
            producer: 'capital-town-center',
            count: 2,
        })
    })

    it.each([
        ['U+00A0', '\u00a0'],
        ['U+202F', '\u202f'],
    ])('treats %s as a space between tokens', (_, space) => {
        const spaced = parsed('produce villager from capital-town-center')
        const result = parsed(['produce', 'villager', 'from', 'capital-town-center'].join(space))
        expect(result).toStrictEqual(spaced)
        expect(parsed(`${space}pause a${space}${space}\npause b`).lines.steps).toEqual([1, 2])
    })

    it('does not split lines on a no-break space', () => {
        expect(onlyIssue('pause a\u00a0pause b').line).toBe(1)
    })
})

describe('triggers', () => {
    it('parses @m:ss with any minute digits', () => {
        expect(step('@1:30 pause a').trigger).toStrictEqual({ kind: 'time', seconds: 90 })
        expect(step('@60:00 pause a').trigger).toStrictEqual({ kind: 'time', seconds: 3600 })
        expect(step('@75:00 pause a').trigger).toStrictEqual({ kind: 'time', seconds: 4500 })
        expect(step('@0:59 pause a').trigger).toStrictEqual({ kind: 'time', seconds: 59 })
    })

    it('parses at N vils', () => {
        expect(step('at 17 vils pause a').trigger).toStrictEqual({ kind: 'villagers', count: 17 })
    })

    it('leaves no trigger key without a prefix', () => {
        expect('trigger' in step('pause a')).toBe(false)
    })

    it.each([
        ['@1:61 pause a', "'@1:61'"],
        ['@1:5 pause a', "'@1:5'"],
        ['@1:005 pause a', "'@1:005'"],
        ['@:30 pause a', "'@:30'"],
        ['at 9 villagers pause a', "'villagers'"],
        ['at nine vils pause a', "'nine'"],
        ['when 9 pause a', "'runs'"],
        ['@1:00', 'end of line'],
    ])('rejects %j', (text, token) => {
        const issue = onlyIssue(text)
        expect(issue.code).toBe('syntax')
        expect(issue.line).toBe(1)
        expect(issue.message).toContain('line 1')
        expect(issue.message).toContain(token)
    })
})

describe('node tokens', () => {
    it.each(['gold#2', 'gold#8'])('parses %s in every node position', (node) => {
        const result = parsed(
            [
                `start 1 ${node} -> ${node}`,
                `produce villager from tc -> ${node}`,
                `build house from ${node} then ${node}`,
                `move 1 ${node} to ${node}`,
                `rally tc -> ${node}`,
                `when ${node} runs out pause tc`,
            ].join('\n'),
        )
        expect(result.order.start).toStrictEqual({ villagers: { [node]: 1 }, rally: node })
        expect(result.order.steps).toStrictEqual([
            { action: 'produce', producer: 'tc', unit: 'villager', rally: node },
            { action: 'build', building: 'house', from: node, then: node },
            { action: 'move', count: 1, from: node, to: node },
            { action: 'rally', producer: 'tc', to: node },
            { trigger: { kind: 'depleted', node }, action: 'pause', producer: 'tc' },
        ])
    })

    it.each([
        ['gold#1', 'invalid'],
        ['gold#9', 'out-of-range'],
        ['gold#02', 'syntax'],
        ['gold#', 'syntax'],
        ['gold#x', 'syntax'],
        ['gold#2#3', 'syntax'],
        ['wood#2', 'invalid'],
    ])('parses %s and leaves it to validation as %s', (node, code) => {
        expect(step(`move 1 ${node} to wood`)).toMatchObject({ from: node })
        expect(validationCode(`move 1 ${node} to wood`)).toBe(code)
    })

    it('rejects an uppercase node token', () => {
        expect(onlyIssue('move 1 Gold#2 to wood').code).toBe('syntax')
    })
})

describe('move all', () => {
    it('parses all as the count', () => {
        expect(step('move all gold to gold#2')).toStrictEqual({ action: 'move', count: 'all', from: 'gold', to: 'gold#2' })
    })

    it.each(['move All gold to gold#2', 'move ALL gold to gold#2'])('rejects %j', (text) => {
        expect(onlyIssue(text).code).toBe('syntax')
    })

    it('parses a zero count and leaves it to validation', () => {
        expect(step('move 0 gold to wood')).toMatchObject({ count: 0 })
        expect(validationCode('move 0 gold to wood')).toBe('out-of-range')
    })
})

describe('when and whenever triggers', () => {
    it('parses a depleted trigger without a reaction flag', () => {
        expect(step('when berry runs out move 6 berry to farm')).toStrictEqual({
            trigger: { kind: 'depleted', node: 'berry' },
            action: 'move',
            count: 6,
            from: 'berry',
            to: 'farm',
        })
    })

    it('parses whenever as a depleted reaction', () => {
        expect(step('whenever gold runs out move all gold to gold#2')).toStrictEqual({
            trigger: { kind: 'depleted', node: 'gold' },
            reaction: true,
            action: 'move',
            count: 'all',
            from: 'gold',
            to: 'gold#2',
        })
    })

    it('parses a bank trigger', () => {
        expect(step('when wood >= 400 build lumber-camp from wood').trigger).toStrictEqual({ kind: 'bank', resource: 'wood', atLeast: 400 })
    })

    it.each([
        ['when farm runs out pause capital-town-center', 'invalid'],
        ['when food runs out pause capital-town-center', 'unknown-id'],
        ['when gold#9 runs out pause capital-town-center', 'out-of-range'],
        ['when sheep >= 400 pause capital-town-center', 'unknown-id'],
        ['when wood >= 400000 pause capital-town-center', 'out-of-range'],
    ])('parses %j and leaves it to validation as %s', (text, code) => {
        expect(step(text)).toHaveProperty('trigger')
        expect(validationCode(text)).toBe(code)
    })

    it.each([
        ['when berry pause tc', "'runs'"],
        ['when berry runs pause tc', "'out'"],
        ['when berry', 'end of line'],
        ['when wood > 400 pause tc', ">="],
        ['when wood >= -5 pause tc', "'-5'"],
        ['when wood >= 4.5 pause tc', "'4.5'"],
        ['when wood>=400 pause tc', "'wood>=400'"],
        ['when Wood >= 400 pause tc', "'Wood'"],
        ['when gold#2 >= 400 pause tc', 'resource id'],
        ['whenever wood >= 400 pause tc', 'whenever takes only `<node> runs out`'],
        ['whenever berry pause tc', 'whenever takes only `<node> runs out`'],
        ['whenever', 'whenever takes only `<node> runs out`'],
        ['when berry runs out', 'expected an action'],
    ])('rejects %j', (text, expected) => {
        const issue = onlyIssue(text)
        expect(issue.code).toBe('syntax')
        expect(issue.line).toBe(1)
        expect(issue.message).toContain(expected)
    })

    it.each(['when gold runs out', 'whenever gold runs out'])('rejects a start line with the prefix %j', (prefix) => {
        const issue = onlyIssue(`${prefix} start 1 sheep`)
        expect(issue.message).toContain("'start' takes no trigger")
    })

    it('reports one issue per bad when line without hiding others', () => {
        const found = issues('pause a\nwhen wood > 400 pause a\nwhenever berry pause a\nwhen berry runs out pause a\nbogus')
        expect(found.map((i) => i.line)).toEqual([2, 3, 5])
    })
})

describe('actions', () => {
    it('parses produce with every suffix', () => {
        expect(step('produce villager from capital-town-center#2 x3 -> sheep walk 4s')).toStrictEqual({
            action: 'produce',
            unit: 'villager',
            producer: 'capital-town-center',
            instance: 2,
            count: 3,
            rally: 'sheep',
            walkSeconds: 4,
        })
    })

    it('parses walk on produce without a rally target', () => {
        expect(step('produce villager from capital-town-center walk 4s')).toStrictEqual({
            action: 'produce',
            unit: 'villager',
            producer: 'capital-town-center',
            walkSeconds: 4,
        })
    })

    it('parses build with and without optional parts', () => {
        expect(step('build house with 2 from wood then gold walk 6s')).toStrictEqual({
            action: 'build',
            building: 'house',
            builders: 2,
            from: 'wood',
            then: 'gold',
            walkSeconds: 6,
        })
        expect(step('build mill from sheep')).toStrictEqual({ action: 'build', building: 'mill', from: 'sheep' })
    })

    it('parses research with and without at', () => {
        expect(step('research wheelbarrow at mill')).toStrictEqual({ action: 'research', tech: 'wheelbarrow', at: 'mill' })
        expect(step('research veteran-longbowmen')).toStrictEqual({ action: 'research', tech: 'veteran-longbowmen' })
    })

    it('parses move, rally and pause', () => {
        expect(step('move 3 sheep to berry walk 5s')).toStrictEqual({ action: 'move', count: 3, from: 'sheep', to: 'berry', walkSeconds: 5 })
        expect(step('rally capital-town-center#1 -> wood walk 3s')).toStrictEqual({
            action: 'rally',
            producer: 'capital-town-center',
            instance: 1,
            to: 'wood',
            walkSeconds: 3,
        })
        expect(step('pause capital-town-center')).toStrictEqual({ action: 'pause', producer: 'capital-town-center' })
    })

    it('reads numbers as decimal integers, leading zeros included', () => {
        expect(step('produce villager from tc#007 x03 walk 010s')).toStrictEqual({
            action: 'produce',
            unit: 'villager',
            producer: 'tc',
            instance: 7,
            count: 3,
            walkSeconds: 10,
        })
    })

    it('passes a huge number through as Number gives it', () => {
        const digits = '9'.repeat(400)
        expect(step(`move ${digits} sheep to wood`)).toStrictEqual({ action: 'move', count: Infinity, from: 'sheep', to: 'wood' })
    })

    it('does no id, bound or cross-field checks', () => {
        expect(step('produce villager from capital-town-center -> nowhere walk 4s')).toStrictEqual({
            action: 'produce',
            unit: 'villager',
            producer: 'capital-town-center',
            rally: 'nowhere',
            walkSeconds: 4,
        })
        expect(step('@75:00 produce villager from nowhere x999')).toStrictEqual({
            trigger: { kind: 'time', seconds: 4500 },
            action: 'produce',
            unit: 'villager',
            producer: 'nowhere',
            count: 999,
        })
        expect(step('produce longbowman from archery-range x0 -> wood')).toStrictEqual({
            action: 'produce',
            unit: 'longbowman',
            producer: 'archery-range',
            count: 0,
            rally: 'wood',
        })
    })

    it.each([
        ['produce villager from tc walk 4s x3', "'x3'"],
        ['produce villager from tc -> sheep x3', "'x3'"],
        ['produce villager from tc walk 4s -> sheep', "'->'"],
        ['produce villager from tc walk 4 s', "'4'"],
        ['produce villager from tc walk 4.5s', "'4.5s'"],
        ['produce villager from tc walk', 'end of line'],
        ['produce Villager from tc', "'Villager'"],
        ['produce villager from Capital-Town-Center', "'Capital-Town-Center'"],
        ['produce villager from tc x-3', "'x-3'"],
        ['produce villager from tc x1.5', "'x1.5'"],
        ['produce villager from tc x 3', "'x'"],
        ['produce villager from tc#-1', "'tc#-1'"],
        ['produce villager from tc #1', "'#1'"],
        ['produce villager tc', "'tc'"],
        ['produce villager', 'end of line'],
        ['move -3 sheep to berry', "'-3'"],
        ['move 2.5 sheep to berry', "'2.5'"],
        ['move +3 sheep to berry', "'+3'"],
        ['move 3 sheep berry', "'berry'"],
        ['build house with 2 wood', "'wood'"],
        ['build house with -2 from wood', "'-2'"],
        ['build house from wood walk 6s then gold', "'then'"],
        ['build house from Wood', "'Wood'"],
        ['rally capital-town-center ->', 'end of line'],
        ['rally capital-town-center wood', "'wood'"],
        ['research wheelbarrow at', 'end of line'],
        ['research wheelbarrow at mill now', "'now'"],
        ['pause capital-town-center now', "'now'"],
        ['pause tc-', "'tc-'"],
        ['pause tc--a', "'tc--a'"],
        ['Produce villager from tc', "'Produce'"],
        ['train villager from tc', "'train'"],
        ['@1:00 train villager from tc', "'train'"],
    ])('rejects %j as syntax naming the token', (text, token) => {
        const issue = onlyIssue(`# comment\n${text}`)
        expect(issue).toStrictEqual({ code: 'syntax', message: expect.stringContaining(token), line: 2 })
        expect(issue.message).toContain('line 2')
    })

    it('ignores inherited object keys as action words', () => {
        expect(onlyIssue('constructor x').message).toContain("'constructor'")
        expect(onlyIssue('toString x').message).toContain("'toString'")
    })

    it('truncates a long token in the message', () => {
        const message = onlyIssue(`pause ${'A'.repeat(500)}`).message
        expect(message.length).toBeLessThan(120)
        expect(message).toContain(`'${'A'.repeat(40)}...'`)
    })
})

describe('start line', () => {
    it('parses villagers and rally', () => {
        const result = parsed('start 4 sheep 2 wood -> sheep\npause a')
        expect(result.order.start).toStrictEqual({ villagers: { sheep: 4, wood: 2 }, rally: 'sheep' })
        expect(result.lines).toStrictEqual({ start: 1, steps: [2] })
    })

    it('parses rally alone and villagers alone', () => {
        expect(parsed('start -> sheep').order.start).toStrictEqual({ rally: 'sheep' })
        expect(parsed('start 6 sheep').order.start).toStrictEqual({ villagers: { sheep: 6 } })
    })

    it('may follow comments and blanks', () => {
        expect(parsed('# a\n\nstart -> wood\npause a').lines).toStrictEqual({ start: 3, steps: [4] })
    })

    it('does not check node names', () => {
        expect(parsed('start 6 nowhere -> elsewhere').order.start).toStrictEqual({ villagers: { nowhere: 6 }, rally: 'elsewhere' })
    })

    it.each([
        ['start', 1, 'end of line'],
        ['start 2 sheep 3 sheep', 1, "'sheep'"],
        ['start -> sheep\nstart -> wood', 2, "'start'"],
        ['pause a\nstart -> sheep', 2, "'start'"],
        ['@0:00 start 6 sheep', 1, "'@0:00'"],
        ['at 6 vils start 6 sheep', 1, "'at'"],
        ['start -> sheep 6 wood', 1, "'6'"],
        ['start 6', 1, 'end of line'],
        ['start 6 Sheep', 1, "'Sheep'"],
        ['start sheep', 1, "'sheep'"],
    ])('rejects %j on line %i', (text, line, token) => {
        const issue = onlyIssue(text)
        expect(issue).toStrictEqual({ code: 'syntax', message: expect.stringContaining(token), line })
        expect(issue.message).toContain(`line ${line}`)
    })

    it('does not count a failed step line as a step for start ordering', () => {
        expect(onlyIssue('bogus\nstart -> sheep').line).toBe(1)
        expect(onlyIssue('pause B\nstart -> sheep').line).toBe(1)
    })

    it('still rejects a start after a parsed step when an earlier line failed', () => {
        const found = issues('bogus\npause a\nstart -> sheep')
        expect(found.map((i) => i.line)).toEqual([1, 3])
        expect(found[1].message).toContain('before every step')
    })

    it('treats a failed start line as a start for the second-start rule', () => {
        const found = issues('start 2 sheep 2 sheep\nstart -> sheep')
        expect(found.map((i) => i.line)).toEqual([1, 2])
        expect(found[1].message).toContain('second')
    })
})

describe('multiple issues', () => {
    it('reports one issue per bad line in line order', () => {
        const found = issues('pause a\nbogus\n@1:61 pause a\n\npause B extra\nmove 1 sheep to wood\nstart -> sheep')
        expect(found.map((i) => i.line)).toEqual([2, 3, 5, 7])
        for (const issue of found) {
            expect(issue.code).toBe('syntax')
            expect('step' in issue).toBe(false)
            expect(issue.message).toContain(`line ${issue.line}`)
        }
    })
})

describe('formatBuildStep', () => {
    it.each<[BuildStep, string]>([
        [{ trigger: { kind: 'depleted', node: 'gold' }, reaction: true, action: 'move', count: 'all', from: 'gold', to: 'gold#2' }, 'whenever gold runs out move all gold to gold#2'],
        [{ trigger: { kind: 'depleted', node: 'berry' }, action: 'move', count: 6, from: 'berry', to: 'farm' }, 'when berry runs out move 6 berry to farm'],
        [{ trigger: { kind: 'bank', resource: 'wood', atLeast: 400 }, action: 'pause', producer: 'tc' }, 'when wood >= 400 pause tc'],
        [{ trigger: { kind: 'time', seconds: 65 }, action: 'pause', producer: 'tc' }, '@1:05 pause tc'],
        [{ trigger: { kind: 'time', seconds: 65.4 }, action: 'pause', producer: 'tc' }, '@1:05 pause tc'],
        [{ trigger: { kind: 'time', seconds: 65.5 }, action: 'pause', producer: 'tc' }, '@1:06 pause tc'],
        [{ trigger: { kind: 'time', seconds: 59.6 }, action: 'pause', producer: 'tc' }, '@1:00 pause tc'],
        [{ trigger: { kind: 'villagers', count: 9 }, action: 'pause', producer: 'tc' }, 'at 9 vils pause tc'],
        [{ action: 'move', count: 3, from: 'sheep', to: 'wood' }, 'move 3 sheep to wood'],
    ])('prints %j as one line', (input, text) => {
        expect(formatBuildStep(input)).toBe(text)
        expect(formatBuildStep(input)).not.toContain('\n')
    })

    it('prints a reaction flag without whenever unless the trigger is depleted, and never throws', () => {
        const odd: unknown[] = [
            { trigger: { kind: 'time', seconds: 5 }, reaction: true, action: 'pause', producer: 'tc' },
            { reaction: true, action: 'pause', producer: 'tc' },
            { trigger: { kind: 'bank', resource: 'wood', atLeast: 1 }, reaction: true, action: 'pause', producer: 'tc' },
        ]
        expect(odd.map((o) => formatBuildStep(o as BuildStep))).toEqual(['@0:05 pause tc', 'pause tc', 'when wood >= 1 pause tc'])
        expect(() => formatBuildStep({ trigger: { kind: 'mystery' }, action: 'pause', producer: 'tc' } as unknown as BuildStep)).not.toThrow()
        expect(formatBuildStep({ trigger: { kind: 'mystery' }, action: 'pause', producer: 'tc' } as unknown as BuildStep)).toBe('pause tc')
    })

    it('makes formatBuildOrderText the start line then one step line each', () => {
        const text = formatBuildOrderText(representable)
        const lines = text.split('\n')
        expect(lines[0]).toBe('start 4 sheep 2 wood 1 gold#2 -> sheep')
        expect(lines.slice(1)).toEqual(representable.steps.map(formatBuildStep))
    })
})

describe('formatBuildOrderText', () => {
    it('emits start first with nodes in gather node order', () => {
        const text = formatBuildOrderText({
            civ: 'english',
            name: 'x',
            start: { rally: 'wood', villagers: { stone: 1, wood: 2, sheep: 3, berry: 0 } },
            steps: [{ action: 'pause', producer: 'tc' }],
        })
        expect(text).toBe('start 3 sheep 0 berry 2 wood 1 stone -> wood\npause tc')
    })

    it('prints start deposits in gather node order whatever the key order', () => {
        const text = formatBuildOrderText({
            civ: 'english',
            name: 'x',
            start: { villagers: { stone: 1, 'gold#3': 1, gold: 2, 'gold#2': 1 } },
            steps: [],
        })
        expect(text).toBe('start 2 gold 1 gold#2 1 gold#3 1 stone')
    })

    it('omits start when it is empty or absent', () => {
        const steps: BuildOrder['steps'] = [{ action: 'pause', producer: 'tc' }]
        expect(formatBuildOrderText({ civ: 'english', name: 'x', start: {}, steps })).toBe('pause tc')
        expect(formatBuildOrderText({ civ: 'english', name: 'x', start: { villagers: {} }, steps })).toBe('pause tc')
        expect(formatBuildOrderText({ civ: 'english', name: 'x', steps })).toBe('pause tc')
    })

    it('prints time triggers with two-digit seconds and uncapped minutes', () => {
        const at = (seconds: number) =>
            formatBuildOrderText({ civ: 'english', name: 'x', steps: [{ trigger: { kind: 'time', seconds }, action: 'pause', producer: 'tc' }] })
        expect(at(0)).toBe('@0:00 pause tc')
        expect(at(65)).toBe('@1:05 pause tc')
        expect(at(3600)).toBe('@60:00 pause tc')
        expect(at(4500)).toBe('@75:00 pause tc')
    })

    it('prints zero-valued optional numbers instead of dropping them', () => {
        const text = formatBuildOrderText({
            civ: 'english',
            name: 'x',
            steps: [
                { action: 'produce', unit: 'villager', producer: 'tc', instance: 0, count: 0, rally: 'sheep', walkSeconds: 0 },
                { action: 'build', building: 'house', builders: 0, from: 'wood' },
            ],
        })
        expect(text).toBe('produce villager from tc#0 x0 -> sheep walk 0s\nbuild house with 0 from wood')
    })

    it('drops civ, name and source', () => {
        const text = formatBuildOrderText({ civ: 'english', name: 'Secret Name', source: 'https://example.com/src', steps: [] })
        expect(text).toBe('')
        expect(text).not.toContain('english')
    })

    it('prints a decimal as is, which re-parses as syntax on that line', () => {
        const text = formatBuildOrderText({
            civ: 'english',
            name: 'x',
            start: { rally: 'sheep' },
            steps: [
                { action: 'pause', producer: 'tc' },
                { action: 'produce', unit: 'villager', producer: 'tc', rally: 'sheep', walkSeconds: 4.5 },
            ],
        })
        expect(text).toContain('walk 4.5s')
        const issue = onlyIssue(text)
        expect(issue.line).toBe(3)
        expect(issue.message).toContain("'4.5s'")
    })

    it('does not throw on values the grammar cannot represent', () => {
        const odd = {
            civ: 'english',
            name: 'x',
            start: { villagers: { sheep: -1 } },
            steps: [
                { trigger: { kind: 'time', seconds: -5.5 }, action: 'move', count: NaN, from: 'sheep', to: 'wood' },
                { trigger: { kind: 'later' }, action: 'pause', producer: 'tc' },
                { action: 'dance' },
            ],
        } as unknown as BuildOrder
        expect(() => formatBuildOrderText(odd)).not.toThrow()
        expect(formatBuildOrderText(odd).split('\n')).toHaveLength(4)
    })
})

describe('bounded work on long input', () => {
    function elapsed(text: string): number {
        const begin = performance.now()
        parseBuildOrderText(text)
        return performance.now() - begin
    }

    it('parses a 20,000-character paste quickly', () => {
        const line = 'produce villager from capital-town-center x3 -> sheep walk 4s\n'
        const valid = line.repeat(Math.floor(20000 / line.length))
        expect(parsed(valid).order.steps.length).toBeGreaterThan(300)
        expect(elapsed(valid)).toBeLessThan(1000)
    })

    it.each([
        ['one long id-like token', `pause ${'a'.repeat(19990)}!`],
        ['one long dash run', `pause ${'a-'.repeat(9995)}`],
        ['one long trigger', `@${'1'.repeat(19990)}:6`],
        ['one long word with no spaces', 'x'.repeat(20000)],
    ])('rejects %s quickly', (_, text) => {
        expect(issues(text)).toHaveLength(1)
        expect(elapsed(text)).toBeLessThan(1000)
    })
})
