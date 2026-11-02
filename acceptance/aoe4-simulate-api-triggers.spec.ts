import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { INFINITE_NODES, buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Reason = 'resources' | 'villagers' | 'population' | 'prerequisite'
type Timing = {
  step: number
  status: 'completed' | 'in-progress' | 'waiting' | 'not-reached'
  armedAt: number | null
  startedAt: number | null
  waitSeconds: number
  waitingOn: Reason | 'trigger' | 'earlier-step' | null
  waitBreakdown: Partial<Record<Reason, number>>
}
type Warning = { code: string; severity: string; node?: string; at: number; idleVillagers?: number; step?: number }
type Result = {
  sampleSeconds: number
  times: number[]
  floating: Record<string, number[]>
  steps: Timing[]
  depletions: { node: string; amount: number | null; depletedAt: number | null }[]
  warnings: Warning[]
}
type Issue = { code: string; message: string; step?: number }

const CTC = 'capital-town-center'
const START = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
const BERRY_RUN = { autoHouses: false, nodeAmounts: { berry: 601 } }
const ranOut = (node: string) => ({ kind: 'depleted', node })
const reaction = (step: object, node = 'berry') => ({ ...step, trigger: ranOut(node), reaction: true })
const moveAll = { action: 'move', count: 'all', from: 'berry', to: 'wood' }
const rally = (to: string, extra: object = {}) => ({ action: 'rally', producer: CTC, to, ...extra })
const barracks = (extra: object = {}) => ({ action: 'build', building: 'barracks', builders: 1, from: 'wood', ...extra })

function order(steps: unknown[], inputs: object = {}, start: object = START) {
  return { buildOrder: { civ: 'english', name: 'Triggers', start, steps }, inputs: { autoHouses: false, ...inputs } }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<Result> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

async function issuesOf(request: APIRequestContext, body: unknown): Promise<Issue[]> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(400)
  const json = await response.json()
  expect(json.error).toBe(json.issues[0].message)
  return json.issues
}

const depletionOf = (result: Result, node: string) => result.depletions.find((d) => d.node === node)
const sum = (breakdown: Timing['waitBreakdown']) => Object.values(breakdown).reduce((a, b) => a + b, 0)
const stuck = (result: Result) => result.warnings.filter((w) => w.code === 'step-stuck')

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('a depleted trigger', () => {
  test('arms and starts at the exact run-out instant, between samples', async ({ request }) => {
    const result = await simulate(request, order([rally('berry', { trigger: ranOut('berry') })], BERRY_RUN))
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(runOut % result.sampleSeconds).not.toBe(0)
    expect(result.steps[0]).toMatchObject({ status: 'completed', armedAt: runOut, startedAt: runOut, waitingOn: null })
  })

  test('on a node that never runs out leaves the step not-reached on its trigger, with no issue and no warning', async ({ request }) => {
    const infinite = await simulate(request, order([rally('berry', { trigger: ranOut('berry') })], { nodeAmounts: { berry: null } }))
    expect(infinite.steps[0]).toMatchObject({ status: 'not-reached', startedAt: null, armedAt: null, waitingOn: 'trigger' })
    expect(infinite.warnings).toEqual([])

    const ungathered = await simulate(request, order([rally('berry', { trigger: ranOut('stone') })]))
    expect(ungathered.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })

    const stocked = await simulate(request, order([rally('berry', { trigger: ranOut('berry') })], { nodeAmounts: { berry: 100000 } }))
    expect(stocked.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
  })

  test('on a deposit nothing else names creates its stock at the default amount', async ({ request }) => {
    const result = await simulate(request, order([rally('berry', { trigger: ranOut('gold#3') })]))

    expect(depletionOf(result, 'gold#3')).toEqual({ node: 'gold#3', amount: 4000, depletedAt: null })
    expect(result.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
  })

  test('on the node a step waits for starts that step only once the node is gone, behind an earlier waiting step', async ({ request }) => {
    const result = await simulate(
      request,
      order([{ action: 'pause', producer: CTC, trigger: { kind: 'time', seconds: 200 } }, rally('berry', { trigger: ranOut('berry') })], BERRY_RUN),
    )
    expect(result.steps.map((s) => s.waitingOn)).toEqual([null, null])
    expect(result.steps[1].startedAt).toBe(depletionOf(result, 'berry')!.depletedAt)
    expect(result.steps[1].startedAt).toBeGreaterThan(result.steps[0].startedAt!)
  })
})

test.describe('a bank trigger', () => {
  const trigger = (atLeast: number, resource = 'wood') => ({ kind: 'bank', resource, atLeast })
  const move = (extra: object) => ({ action: 'move', count: 1, from: 'wood', to: 'berry', ...extra })

  test('arms at the instant the bank reaches the amount, not on a sample', async ({ request }) => {
    const result = await simulate(request, order([move({ trigger: trigger(400) })]))
    const { armedAt, startedAt } = result.steps[0]

    expect(armedAt).toBe(startedAt)
    expect(armedAt! % result.sampleSeconds).not.toBe(0)
    const before = Math.floor(armedAt! / result.sampleSeconds)
    const [low, high] = [result.floating.wood[before], result.floating.wood[before + 1]]
    expect(low).toBeLessThan(400)
    expect(high).toBeGreaterThan(400)
    const interpolated = low + ((high - low) * (armedAt! - result.times[before])) / result.sampleSeconds
    expect(Math.abs(interpolated - 400)).toBeLessThan(2)
  })

  test('with an amount of 0 holds at once', async ({ request }) => {
    const result = await simulate(request, order([move({ trigger: trigger(0) })]))
    expect(result.steps[0]).toMatchObject({ status: 'completed', armedAt: 0, startedAt: 0 })
  })

  test('on a resource with no income never arms and is not-reached on its trigger', async ({ request }) => {
    const result = await simulate(request, order([move({ trigger: trigger(400, 'gold') })]))
    expect(result.steps[0]).toMatchObject({ status: 'not-reached', armedAt: null, waitingOn: 'trigger' })
  })

  test('behind an unstarted step waits on that step, then arms once it starts', async ({ request }) => {
    const gated = order([move({ trigger: { kind: 'time', seconds: 600 } }), move({ trigger: trigger(400) })])
    const result = await simulate(request, { ...gated, inputs: { ...gated.inputs, durationSeconds: 300 } })
    expect(result.steps.map((s) => [s.status, s.waitingOn])).toEqual([
      ['not-reached', 'trigger'],
      ['not-reached', 'earlier-step'],
    ])

    const started = await simulate(request, order([move({ trigger: { kind: 'time', seconds: 300 } }), move({ trigger: trigger(400) })]))
    expect(started.steps[1].armedAt).toBe(300)
    expect(started.steps[1].startedAt).toBe(300)
  })
})

test.describe('reaction steps', () => {
  test('start at the run-out instant before a non-reaction step that is still waiting, which then keeps its place', async ({ request }) => {
    const result = await simulate(
      request,
      order(
        [
          { action: 'move', count: 1, from: 'wood', to: 'berry', trigger: { kind: 'bank', resource: 'wood', atLeast: 5000 } },
          reaction(moveAll),
          rally('berry'),
        ],
        { nodeAmounts: { berry: 601 }, durationSeconds: 600 },
      ),
    )
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(result.steps[1]).toMatchObject({ status: 'completed', armedAt: runOut, startedAt: runOut })
    expect(result.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
    expect(result.steps[2]).toMatchObject({ status: 'not-reached', waitingOn: 'earlier-step' })
    const idle = result.warnings.find((w) => w.code === 'node-depleted')
    expect(idle).toMatchObject({ severity: 'info', idleVillagers: 0, at: runOut })
  })

  test('without the reaction the same run-out is a warning naming the idle villagers', async ({ request }) => {
    const result = await simulate(request, order([rally('wood')], BERRY_RUN))
    expect(result.warnings.find((w) => w.code === 'node-depleted')).toMatchObject({ severity: 'warning', idleVillagers: 3 })
  })

  test('listed first with a trigger that never holds do not delay the next step', async ({ request }) => {
    const result = await simulate(request, order([reaction(rally('wood')), rally('berry')], { nodeAmounts: { berry: null } }))
    expect(result.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
    expect(result.steps[1]).toMatchObject({ status: 'completed', armedAt: 0, startedAt: 0 })
  })

  test('on one node start in step order and each sees the villagers the earlier one left', async ({ request }) => {
    const result = await simulate(request, order([reaction(moveAll), reaction({ action: 'move', count: 2, from: 'berry', to: 'wood' })], BERRY_RUN))
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: runOut })
    expect(result.steps[1]).toMatchObject({ status: 'waiting', armedAt: runOut, startedAt: null, waitingOn: 'villagers' })
  })

  test('go before the cursor step when both want the same villagers at the run-out instant', async ({ request }) => {
    const result = await simulate(
      request,
      order([{ action: 'move', count: 2, from: 'berry', to: 'gold', trigger: ranOut('berry') }, reaction(moveAll)], BERRY_RUN),
    )
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: runOut })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', armedAt: runOut, waitingOn: 'villagers' })
  })

  test('go before the cursor step when both want the last wood, and the cursor starts when the bank refills', async ({ request }) => {
    const base = await simulate(request, order([barracks(), barracks(), barracks()], { nodeAmounts: { berry: 0 } }))
    const raced = await simulate(request, order([barracks(), barracks(), barracks(), reaction(barracks())], { nodeAmounts: { berry: 0 } }))
    expect(base.steps.map((s) => s.startedAt)).toEqual([0, expect.any(Number), expect.any(Number)])

    expect(raced.steps[3]).toMatchObject({ status: 'completed', armedAt: 0, startedAt: 0 })
    expect(raced.steps[0].startedAt).toBeGreaterThan(0)
    expect(raced.steps[0].startedAt).toBeCloseTo(base.steps[1].startedAt!, 9)
    expect(raced.steps[0].startedAt! % raced.sampleSeconds).not.toBe(0)
  })

  test('that cannot afford wake at the exact affordability instant and never delay a later non-reaction step', async ({ request }) => {
    const plain = await simulate(request, order([barracks(), rally('berry'), barracks()], { nodeAmounts: { berry: 0 } }))
    const result = await simulate(
      request,
      order([reaction(barracks()), reaction(barracks()), rally('berry')], { nodeAmounts: { berry: 0 } }),
    )
    const [first, second, next] = result.steps

    expect(first.startedAt).toBe(0)
    expect(second.armedAt).toBe(0)
    expect(second.startedAt).toBeCloseTo(plain.steps[2].startedAt!, 9)
    expect(second.startedAt! % result.sampleSeconds).not.toBe(0)
    expect(second.waitingOn).toBeNull()
    expect(sum(second.waitBreakdown)).toBeCloseTo(second.waitSeconds, 9)
    expect(second.waitBreakdown.resources).toBeCloseTo(second.waitSeconds, 9)
    expect(next).toMatchObject({ status: 'completed', startedAt: 0 })
  })

  test('that cannot start at the horizon are waiting with one step-stuck warning and a breakdown spanning the wait, and never delay the next step', async ({ request }) => {
    const result = await simulate(
      request,
      order([reaction({ action: 'move', count: 6, from: 'berry', to: 'wood' }), rally('berry', { trigger: { kind: 'time', seconds: 500 } })], BERRY_RUN),
    )
    const [waiting, next] = result.steps
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(waiting).toMatchObject({ status: 'waiting', armedAt: runOut, startedAt: null, waitingOn: 'villagers' })
    expect(sum(waiting.waitBreakdown)).toBeCloseTo(1200 - runOut, 6)
    expect(waiting.waitBreakdown).toEqual({ villagers: expect.any(Number) })
    expect(next).toMatchObject({ status: 'completed', armedAt: 500, startedAt: 500 })
    expect(stuck(result)).toEqual([expect.objectContaining({ step: 0, waitingOn: 'villagers' })])
  })

  test('not armed at the horizon are not-reached on their trigger, even behind an earlier unstarted step', async ({ request }) => {
    const result = await simulate(
      request,
      order([rally('berry', { trigger: { kind: 'time', seconds: 3000 } }), reaction(moveAll), rally('wood')], { nodeAmounts: { berry: null } }),
    )
    expect(result.steps.map((s) => [s.status, s.waitingOn])).toEqual([
      ['not-reached', 'trigger'],
      ['not-reached', 'trigger'],
      ['not-reached', 'earlier-step'],
    ])
    expect(stuck(result)).toEqual([])
  })

  test('start once: villagers that reach the empty node later are idle arrivals and do not fire it again', async ({ request }) => {
    const trigger = { kind: 'time', seconds: 100 }
    const result = await simulate(
      request,
      order([reaction(moveAll), rally('berry', { trigger }), { action: 'produce', producer: CTC, unit: 'villager', count: 30, trigger }], {
        ...BERRY_RUN,
        autoHouses: true,
      }),
    )
    const runOut = depletionOf(result, 'berry')!.depletedAt!

    expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: runOut })
    const arrivals = result.warnings.filter((w) => w.code === 'idle-arrival' && w.node === 'berry')
    expect(arrivals.length).toBeGreaterThan(0)
    expect(arrivals.every((w) => w.at > runOut)).toBe(true)
    expect(result.warnings.filter((w) => w.code === 'node-depleted')).toHaveLength(1)
  })

  test('are deterministic: two identical runs agree on warnings and every wait breakdown', async ({ request }) => {
    const body = order(
      [reaction({ action: 'move', count: 6, from: 'berry', to: 'wood' }), reaction(barracks()), rally('berry', { trigger: { kind: 'time', seconds: 500 } })],
      BERRY_RUN,
    )
    const [a, b] = [await simulate(request, body), await simulate(request, body)]
    expect(b.warnings).toEqual(a.warnings)
    expect(b.steps).toEqual(a.steps)
  })
})

test.describe('validation of triggers and reactions', () => {
  const PAUSE = { action: 'pause', producer: CTC }
  const bank = (extra: object) => ({ kind: 'bank', resource: 'wood', atLeast: 400, ...extra })
  const stepOrder = (step: object) => order([step])

  const accepted: [string, object][] = [
    ['depleted on a base node', ranOut('berry')],
    ['depleted on a numbered deposit', ranOut('gold#2')],
    ['bank at the lower bound', bank({ atLeast: 0 })],
    ['bank at the upper bound', bank({ atLeast: 100000 })],
    ['bank on wood', bank({})],
  ]
  for (const [name, trigger] of accepted) {
    test(`accepts ${name}`, async ({ request }) => {
      await simulate(request, stepOrder({ ...PAUSE, trigger }))
    })
  }

  const rejected: [string, object, string][] = [
    ['depleted without a node', { kind: 'depleted' }, 'syntax'],
    ['depleted with a numeric node', { kind: 'depleted', node: 3 }, 'syntax'],
    ['depleted on wood', ranOut('wood'), 'invalid'],
    ['depleted on farm', ranOut('farm'), 'invalid'],
    ['depleted on deposit 1 spelled with its number', ranOut('gold#1'), 'invalid'],
    ['depleted on a deposit past the cap', ranOut('gold#9'), 'out-of-range'],
    ['depleted on an unknown node', ranOut('iron'), 'unknown-id'],
    ['bank without atLeast', { kind: 'bank', resource: 'wood' }, 'syntax'],
    ['bank with a string atLeast', bank({ atLeast: '400' }), 'syntax'],
    ['bank without a resource', { kind: 'bank', atLeast: 400 }, 'syntax'],
    ['bank on a node name', bank({ resource: 'sheep' }), 'unknown-id'],
    ['bank with a fractional atLeast', bank({ atLeast: 400.5 }), 'out-of-range'],
    ['bank with a negative atLeast', bank({ atLeast: -1 }), 'out-of-range'],
    ['bank with atLeast past the bound', bank({ atLeast: 100001 }), 'out-of-range'],
  ]
  for (const [name, trigger, code] of rejected) {
    test(`rejects ${name} as ${code}`, async ({ request }) => {
      const issues = await issuesOf(request, stepOrder({ ...PAUSE, trigger }))
      expect(issues).toEqual([expect.objectContaining({ code, step: 0 })])
    })
  }

  test('reports a node problem at the trigger path', async ({ request }) => {
    const [issue] = await issuesOf(request, stepOrder({ ...PAUSE, trigger: ranOut('gold#9') }))
    expect(issue.message).toContain('in trigger.node')
  })

  test('names the bound of atLeast when it is out of range', async ({ request }) => {
    const [issue] = await issuesOf(request, stepOrder({ ...PAUSE, trigger: bank({ atLeast: 100001 }) }))
    expect(issue.message).toContain('trigger.atLeast')
    expect(issue.message).toContain('100000')
  })

  test('rejects an unknown trigger kind and lists all four kinds', async ({ request }) => {
    const [issue] = await issuesOf(request, stepOrder({ ...PAUSE, trigger: { kind: 'event' } }))
    expect(issue.code).toBe('unknown-trigger-kind')
    for (const kind of ['time', 'villagers', 'depleted', 'bank']) expect(issue.message).toContain(kind)
  })

  const actions: [string, object][] = [
    ['pause', PAUSE],
    ['produce', { action: 'produce', producer: CTC, unit: 'villager' }],
    ['rally', rally('wood')],
    ['move', { action: 'move', count: 'all', from: 'berry', to: 'wood' }],
    ['build', { action: 'build', building: 'house', builders: 1, from: 'wood' }],
  ]
  for (const [name, step] of actions) {
    test(`accepts a ${name} reaction on a depleted trigger`, async ({ request }) => {
      await simulate(request, stepOrder(reaction(step)))
    })
  }

  const notReactions: [string, object | undefined][] = [
    ['no trigger', undefined],
    ['a time trigger', { kind: 'time', seconds: 5 }],
    ['a villagers trigger', { kind: 'villagers', count: 7 }],
    ['a bank trigger', bank({})],
  ]
  for (const [name, trigger] of notReactions) {
    test(`rejects a reaction with ${name} as invalid`, async ({ request }) => {
      const issues = await issuesOf(request, stepOrder({ ...PAUSE, trigger, reaction: true }))
      expect(issues).toEqual([expect.objectContaining({ code: 'invalid', step: 0 })])
      expect(issues[0].message).toContain('only a step triggered by a node running out can be a reaction')
    })
  }

  for (const value of [false, 'yes']) {
    test(`rejects reaction: ${JSON.stringify(value)} as syntax`, async ({ request }) => {
      const issues = await issuesOf(request, stepOrder({ ...PAUSE, trigger: ranOut('berry'), reaction: value }))
      expect(issues).toEqual([expect.objectContaining({ code: 'syntax', step: 0 })])
    })
  }

  test('reports only the unknown kind for a reaction on an unknown trigger kind', async ({ request }) => {
    const issues = await issuesOf(request, stepOrder({ ...PAUSE, trigger: { kind: 'event' }, reaction: true }))
    expect(issues.map((i) => i.code)).toEqual(['unknown-trigger-kind'])
  })
})

test.describe('default node amounts', () => {
  const DEFAULTS = { sheep: 3000, berry: 1500, deer: 1750, boar: 2000, gold: 4000, stone: 1200 }
  const USES_EVERY_NODE = order(
    [
      { action: 'move', count: 1, from: 'berry', to: 'deer' },
      { action: 'move', count: 1, from: 'wood', to: 'boar' },
      { action: 'move', count: 1, from: 'wood', to: 'stone' },
      { action: 'move', count: 1, from: 'wood', to: 'gold' },
      { action: 'move', count: 1, from: 'wood', to: 'sheep' },
    ],
    {},
    { villagers: { berry: 3, wood: 3 }, rally: 'wood' },
  )

  test('list every node a run uses with its shipped starting amount', async ({ request }) => {
    const result = await simulate(request, USES_EVERY_NODE)
    for (const [node, amount] of Object.entries(DEFAULTS)) expect(depletionOf(result, node)).toMatchObject({ node, amount })
  })

  test('are replaced by a null override that keeps that node infinite and a numeric override that wins', async ({ request }) => {
    const result = await simulate(request, { ...USES_EVERY_NODE, inputs: { autoHouses: false, nodeAmounts: { gold: null, stone: 900 } } })
    expect(depletionOf(result, 'gold')).toEqual({ node: 'gold', amount: null, depletedAt: null })
    expect(depletionOf(result, 'stone')).toMatchObject({ amount: 900 })
    expect(depletionOf(result, 'sheep')).toMatchObject({ amount: 3000 })
  })

  test('start a numbered gold deposit at the gold amount while a null gold override keeps deposit 1 infinite', async ({ request }) => {
    const body = order([rally('berry', { trigger: ranOut('gold#2') })], { nodeAmounts: { gold: null } }, { villagers: { gold: 6 }, rally: 'gold' })
    const result = await simulate(request, body)
    expect(depletionOf(result, 'gold')).toMatchObject({ amount: null })
    expect(depletionOf(result, 'gold#2')).toMatchObject({ amount: 4000 })
  })

  test('never apply to wood or farm', async ({ request }) => {
    const result = await simulate(request, order([], {}, { villagers: { wood: 6 }, rally: 'wood' }))
    expect(result.depletions.map((d) => d.node).sort()).toEqual(Object.keys(DEFAULTS).sort())
  })

  test('leave an order that gathers only wood unchanged apart from the amounts reported', async ({ request }) => {
    const woodOnly = order([{ action: 'produce', producer: CTC, unit: 'villager', count: 5 }], { durationSeconds: 300 }, { villagers: { wood: 6 }, rally: 'wood' })
    const finite = await simulate(request, woodOnly)
    const infinite = await simulate(request, { ...woodOnly, inputs: { ...woodOnly.inputs, nodeAmounts: INFINITE_NODES } })
    const { depletions: finiteDepletions, ...finiteRest } = finite
    const { depletions: infiniteDepletions, ...infiniteRest } = infinite
    expect(finiteRest).toEqual(infiniteRest)
    expect(finiteDepletions.every((d) => d.depletedAt === null)).toBe(true)
    expect(infiniteDepletions.every((d) => d.amount === null)).toBe(true)
  })
})

test.describe('the default English 1TC build with default amounts', () => {
  // Start times of the first 24 steps, measured with every node infinite before default amounts shipped.
  const STARTED_AT = [
    0, 25, 45, 60, 143.56666666666663, 143.56666666666663, 166.81904761904764, 230, 240, 246.41254761904764, 260.8153142857143, 273.75049206349206,
    315.805130952381, 352.73044576719576, 363.82392930629044, 363.82392930629044, 371.2841744708995, 379.24054484126987, 387.73044576719576,
    394.89471854497356, 431.01536958786636, 436.94014692646977, 461.01536958786636, 508.3666666666667,
  ]

  test('keeps every step start time of the infinite-node run', async ({ request }) => {
    const finite = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 3600 } })
    const infinite = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 3600, nodeAmounts: INFINITE_NODES } })

    const ownSteps = (r: typeof finite) => r.steps.slice(0, STARTED_AT.length).map((s) => s.startedAt)
    expect(ownSteps(finite)).toEqual(ownSteps(infinite))
    for (const [index, startedAt] of STARTED_AT.entries()) expect(finite.steps[index].startedAt).toBeCloseTo(startedAt, 9)
    expect(finite.steps).toHaveLength(STARTED_AT.length + 1)
    expect(infinite.steps[STARTED_AT.length].startedAt).toBeNull()
  })

  test('runs the sheep out at 782.85 s with six villagers idle and never touches berry, deer, boar or stone', async ({ request }) => {
    const result = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1200 } })

    expect(depletionOf(result, 'sheep')).toMatchObject({ amount: 3000 })
    expect(depletionOf(result, 'sheep')!.depletedAt).toBeCloseTo(782.85, 2)
    expect(result.warnings.filter((w) => w.code === 'node-depleted')).toEqual([
      expect.objectContaining({ node: 'sheep', severity: 'warning', idleVillagers: 6 }),
    ])
    for (const node of ['berry', 'deer', 'boar', 'stone', 'gold']) expect(depletionOf(result, node)!.depletedAt).toBeNull()
  })

  test('runs gold deposit 1 out at 3305.17 s and moves its villagers to gold#2 at that instant', async ({ request }) => {
    const result = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 3600 } })

    expect(depletionOf(result, 'gold')).toMatchObject({ amount: 4000 })
    expect(depletionOf(result, 'gold')!.depletedAt).toBeCloseTo(3305.17, 2)
    expect(depletionOf(result, 'gold#2')).toEqual({ node: 'gold#2', amount: 4000, depletedAt: null })
    expect(result.steps[result.steps.length - 1].startedAt).toBe(depletionOf(result, 'gold')!.depletedAt)
    expect(result.warnings.filter((w) => w.code === 'node-depleted' && w.node === 'gold')).toEqual([
      expect.objectContaining({ severity: 'info', idleVillagers: 0 }),
    ])
    for (const node of ['berry', 'deer', 'boar', 'stone']) expect(depletionOf(result, node)!.depletedAt).toBeNull()
    expect(result.warnings.map((w) => w.at)).toEqual([...result.warnings.map((w) => w.at)].sort((a, b) => a - b))
  })
})
