import { test, expect, type Locator, type Page } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { MARKER_COLORS, MARKER_KIND_LABELS } from '../components/apps/aoe4-build-order/chart-rows'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { CHART_MARKER_KINDS, type BuildOrder, type SimulationResult } from '../lib/aoe4-build-order/model'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { openPage, runSimulation, SIMULATE_PATH } from './helpers'

const TITLE = 'AoE4 Build Order Simulator'
const CHARTS = ['chart-units-produced', 'chart-gather-rates', 'chart-floating-resources'] as const
const RESOURCES = ['food', 'wood', 'gold', 'stone'] as const

const RALLY_PASTE = [
  'start 6 sheep -> sheep',
  'produce villager from capital-town-center x3 -> sheep',
  'at 8 vils rally capital-town-center -> wood',
].join('\n')
const RESEARCH_PASTE = ['start -> sheep', 'research fitted-leatherwork at blacksmith'].join('\n')
const INVALID_PASTE = ['start -> sheep', 'at 8 vils fly capital-town-center'].join('\n')

const hexToRgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`

async function expectChartsDrawn(page: Page) {
  for (const chart of CHARTS) {
    await expect(page.getByTestId(chart)).toBeVisible()
    await expect(page.getByTestId(chart).locator('path.recharts-line-curve[data-series]').first()).toBeVisible()
  }
}

test.describe('AoE4 build order page', () => {
  test('serves its title and lists every prebuilt build; choosing one loads its text', async ({ page }) => {
    await openPage(page)
    await expect(page).toHaveTitle(TITLE)
    await expect(page.locator('h1')).toHaveText(TITLE)

    const select = page.getByTestId('build-order-select')
    const builds = listBuilds()
    await expect(select.locator('option')).toHaveText(builds.map((b) => b.name))
    await expect(select.locator('option')).toHaveText([
      'ENG 1TC',
      'ENG Spear/Longbow into MAA/Crossbow',
      "ENG Knight/Longbow (King's Palace)",
    ])

    const text = page.getByTestId('build-order-text')
    await expect(text).toHaveValue(formatBuildOrderText(builds[0]))
    await text.fill('start -> sheep')
    await expect(select).toHaveValue(builds[0].name)

    const owner = english1tc as unknown as BuildOrder
    await select.selectOption({ label: owner.name })
    await expect(text).toHaveValue(formatBuildOrderText(owner))
  })

  test('runs the default prebuilt build and draws every unit and resource series', async ({ page }) => {
    await openPage(page)
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult

    await expectChartsDrawn(page)
    const units = page.getByTestId('chart-units-produced')
    expect(result.unitsProduced.length).toBeGreaterThan(0)
    for (const { unitId } of result.unitsProduced) {
      await expect(units.locator(`path[data-series="${unitId}"]`)).toHaveCount(1)
    }
    for (const chart of ['chart-gather-rates', 'chart-floating-resources']) {
      for (const kind of RESOURCES) {
        await expect(page.getByTestId(chart).locator(`path[data-series="${kind}"]`)).toHaveCount(1)
      }
    }
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('runs the default prebuilt build to 3600 s with its gold reaction and no error', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('build-order-text')).toHaveValue(/whenever gold runs out move all gold to gold#2/)
    await page.getByTestId('duration-seconds').fill('3600')
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    expect(((await response.json()) as SimulationResult).durationSeconds).toBe(3600)
    await expectChartsDrawn(page)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('runs a pasted build with a start line and a rally step', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    expect(response.request().postDataJSON().text).toBe(RALLY_PASTE)
    await expectChartsDrawn(page)
  })

  test('sends the duration and gets it back', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('duration-seconds').fill('300')
    const response = await runSimulation(page)
    expect(response.request().postDataJSON().inputs.durationSeconds).toBe(300)
    expect(response.status()).toBe(200)
    expect(((await response.json()) as SimulationResult).durationSeconds).toBe(300)
  })

  test('an invalid paste shows the line and token with no chart; a valid run then clears it', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    const bad = await runSimulation(page)
    expect(bad.status()).toBe(400)
    const error = page.getByTestId('simulation-error')
    await expect(error).toBeVisible()
    await expect(error).toContainText('2')
    await expect(error).toContainText('fly')
    for (const chart of CHARTS) {
      await expect(page.getByTestId(chart)).toHaveCount(0)
    }

    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(error).toHaveCount(0)
    await expectChartsDrawn(page)
  })

  test('a failed run after a successful one removes the charts', async ({ page }) => {
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)

    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toBeVisible()
    for (const chart of CHARTS) {
      await expect(page.getByTestId(chart)).toHaveCount(0)
    }
  })

  for (const { label, value, sent } of [
    { label: 'an out-of-range duration', value: '59', sent: 59 },
    { label: 'an emptied duration', value: '', sent: 0 },
  ]) {
    test(`${label} shows an error naming durationSeconds`, async ({ page }) => {
      await openPage(page)
      await page.getByTestId('duration-seconds').fill(value)
      const response = await runSimulation(page)
      expect(response.request().postDataJSON().inputs.durationSeconds).toBe(sent)
      expect(response.status()).toBe(400)
      await expect(page.getByTestId('simulation-error')).toContainText('durationSeconds')
    })
  }

  test('a non-JSON failure shows the HTTP status message', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' })
    )
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(500)
    await expect(page.getByTestId('simulation-error')).toHaveText('The simulation could not be run (HTTP 500).')
  })

  for (const { omittedIssues, shown } of [{ omittedIssues: 5, shown: true }, { omittedIssues: undefined, shown: false }]) {
    test(`a 400 ${shown ? 'with' : 'without'} omittedIssues ${shown ? 'ends the list with the omitted count' : 'shows no omitted-count line'}`, async ({ page }) => {
      await page.route(`**${SIMULATE_PATH}`, (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'first problem',
            issues: [
              { code: 'syntax', message: 'first problem' },
              { code: 'syntax', message: 'second problem' },
            ],
            ...(omittedIssues === undefined ? {} : { omittedIssues }),
          }),
        })
      )
      await openPage(page)
      expect((await runSimulation(page)).status()).toBe(400)
      const error = page.getByTestId('simulation-error')
      await expect(error).toContainText('first problem')
      await expect(error).toContainText('second problem')
      if (shown) {
        await expect(error.getByText('5 more issues not shown.')).toHaveCount(1)
        await expect(error.locator('li').last()).toHaveText('5 more issues not shown.')
      } else {
        await expect(error).not.toContainText('more issues not shown')
      }
    })
  }

  test('clicking a legend item hides its series and clicking again restores it', async ({ page }) => {
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    const chart = page.getByTestId('chart-gather-rates')
    const food = chart.locator('li.recharts-legend-item', { hasText: 'Food' })

    await food.click()
    await expect(chart.locator('li.recharts-legend-item.inactive')).toHaveCount(1)
    await expect(chart.locator('path[data-series="food"]')).toHaveCount(0)
    await expect(chart.locator('path[data-series="wood"]')).toHaveCount(1)

    await food.click()
    await expect(chart.locator('li.recharts-legend-item.inactive')).toHaveCount(0)
    await expect(chart.locator('path[data-series="food"]')).toHaveCount(1)
    await expect(chart.locator('path[data-series="wood"]')).toHaveCount(1)
  })

  test('a research of a tech with ignored effects shows a note naming it', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RESEARCH_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(page.getByTestId('simulation-notes-list')).toHaveCount(0)
    await page.getByTestId('simulation-notes-toggle').click()
    await expect(page.getByTestId('simulation-notes')).toContainText('fitted-leatherwork')
  })

  test('warnings are listed and info messages sit behind a toggle that persists across runs', async ({ page }) => {
    let runs = 0
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      runs += 1
      body.warnings = [
        { code: 'node-depleted', severity: 'warning', message: 'A node ran out.' },
        { code: 'idle-arrival', severity: 'info', message: 'Villagers arrived idle.' },
        ...(runs > 1 ? [{ code: 'idle-arrival', severity: 'info', message: 'Another idle arrival.' }] : []),
      ]
      body.notes = [
        { code: 'tech-effect-ignored', severity: 'info', message: 'An effect is ignored.', step: 0, tech: 'x', properties: [] },
      ]
      await route.fulfill({ response, json: body })
    })
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)

    const warnings = page.getByTestId('simulation-warnings')
    await expect(warnings.getByTestId('simulation-message')).toHaveCount(1)
    await expect(warnings.getByTestId('simulation-message')).toHaveAttribute('data-severity', 'warning')
    await expect(warnings.getByTestId('simulation-message')).toHaveAttribute('data-code', 'node-depleted')

    const toggle = page.getByTestId('simulation-notes-toggle')
    const list = page.getByTestId('simulation-notes-list')
    await expect(toggle).toHaveText('Show 2 info messages')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(list).toHaveCount(0)

    await toggle.click()
    await expect(toggle).toHaveText('Hide info messages')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(list.getByTestId('simulation-message')).toHaveCount(2)
    await expect(list.getByTestId('simulation-message').first()).toHaveAttribute('data-severity', 'info')

    await toggle.click()
    await expect(list).toHaveCount(0)
    await toggle.click()

    expect((await runSimulation(page)).status()).toBe(200)
    await expect(list.getByTestId('simulation-message')).toHaveCount(3)
  })

  test('a successful run with no warning-severity messages shows no warnings element', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      body.warnings = [{ code: 'idle-arrival', severity: 'info', message: 'Villagers arrived idle.' }]
      body.notes = []
      await route.fulfill({ response, json: body })
    })
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)
    await expect(page.getByTestId('simulation-warnings')).toHaveCount(0)
    await expect(page.getByTestId('simulation-notes-toggle')).toHaveText('Show 1 info message')
  })

  test('warnings list warnings before warning-severity notes in result order; info expansion survives a failed run and resets on reload', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      const response = await route.fetch()
      if (!response.ok()) return route.fulfill({ response })
      const body = await response.json()
      body.warnings = [
        { code: 'w-first', severity: 'warning', message: 'First warning.' },
        { code: 'i-one', severity: 'info', message: 'Info one.' },
        { code: 'w-second', severity: 'warning', message: 'Second warning.' },
      ]
      body.notes = [
        { code: 'n-warn', severity: 'warning', message: 'Note warning.', step: 0, tech: 'x', properties: [] },
        { code: 'n-info', severity: 'info', message: 'Note info.', step: 0, tech: 'x', properties: [] },
      ]
      await route.fulfill({ response, json: body })
    })
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)

    const warnings = page.getByTestId('simulation-warnings').getByTestId('simulation-message')
    await expect(warnings).toHaveText(['First warning.', 'Second warning.', 'Note warning.'])
    await expect(warnings).toHaveCount(3)
    await expect(page.getByTestId('simulation-notes-list')).toHaveCount(0)
    await expect(page.getByTestId('simulation-notes-toggle')).toHaveText('Show 2 info messages')

    await page.getByTestId('simulation-notes-toggle').click()
    const infos = page.getByTestId('simulation-notes-list').getByTestId('simulation-message')
    await expect(infos).toHaveText(['Info one.', 'Note info.'])

    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-notes')).toHaveCount(0)
    await page.getByTestId('build-order-text').fill('start -> sheep')
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(page.getByTestId('simulation-notes-toggle')).toHaveAttribute('aria-expanded', 'true')
    await expect(infos).toHaveCount(2)

    await page.reload()
    await page.waitForLoadState('networkidle')
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(page.getByTestId('simulation-notes-toggle')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('simulation-notes-list')).toHaveCount(0)
  })

  test('a failed run shows neither the warnings nor the info messages', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toBeVisible()
    await expect(page.getByTestId('simulation-warnings')).toHaveCount(0)
    await expect(page.getByTestId('simulation-notes')).toHaveCount(0)
  })

  test('a run with no notes shows no notes element', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)
    await expect(page.getByTestId('simulation-notes')).toHaveCount(0)
  })

  test('the Y-axis label does not overlap 4-digit tick labels at 1280 px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openPage(page)
    await page.getByTestId('build-order-text').fill('start -> sheep')
    await page.getByTestId('duration-seconds').fill('3600')
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)

    const yLabels = { 'chart-units-produced': 'Units', 'chart-gather-rates': 'Per minute', 'chart-floating-resources': 'Resources' }
    for (const chart of CHARTS) {
      const root = page.getByTestId(chart)
      await expect(root.locator('.recharts-label')).toHaveText(yLabels[chart])
      const label = (await root.locator('.recharts-label').boundingBox())!
      const ticks = await root.locator('.recharts-cartesian-axis-tick-value', { hasText: /^\d+$/ }).all()
      if (chart === 'chart-floating-resources') {
        const texts = await Promise.all(ticks.map((t) => t.textContent()))
        expect(texts.some((t) => (t ?? '').length >= 4)).toBe(true)
      }
      expect(ticks.length).toBeGreaterThan(1)
      for (const tick of ticks) {
        const box = (await tick.boundingBox())!
        const disjoint = label.x + label.width <= box.x || box.x + box.width <= label.x
        expect(disjoint || label.y + label.height <= box.y || box.y + box.height <= label.y).toBe(true)
      }
    }
  })

  test.describe('chart markers', () => {
    async function expectMarkerLabelsApart(root: Locator, markers: SimulationResult['markers'], chart: string) {
      const boxes: { x: number; y: number; width: number; height: number }[] = []
      for (const marker of markers) {
        const text = root.locator('svg text.recharts-label', { hasText: `${marker.label} ${formatMinSec(marker.at)}` })
        await expect(text).toHaveCount(1)
        boxes.push((await text.boundingBox())!)
      }
      const plot = (await root.locator('.recharts-cartesian-grid').boundingBox())!
      for (const [i, box] of boxes.entries()) {
        const inside = box.x >= plot.x && box.x + box.width <= plot.x + plot.width
        expect(inside, `label ${i} in ${chart} leaves the plot`).toBe(true)
      }
      for (let a = 0; a < boxes.length; a++) {
        for (let b = a + 1; b < boxes.length; b++) {
          const [p, q] = [boxes[a], boxes[b]]
          const apart = p.x + p.width <= q.x || q.x + q.width <= p.x || p.y + p.height <= q.y || q.y + q.height <= p.y
          expect(apart, `labels ${a} and ${b} in ${chart} overlap`).toBe(true)
        }
      }
    }

    for (const width of [768, 390]) {
      test(`marker labels stay apart and inside the plot at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await openPage(page)
        await page.getByTestId('build-order-text').fill(formatBuildOrderText(english1tc as BuildOrder))
        const response = await runSimulation(page)
        expect(response.status()).toBe(200)
        const { markers } = (await response.json()) as SimulationResult
        expect(markers.length).toBeGreaterThan(1)
        await expectChartsDrawn(page)
        for (const chart of CHARTS) {
          await expect(page.getByTestId(chart).locator('svg [data-testid="chart-marker"]')).toHaveCount(markers.length)
          await expectMarkerLabelsApart(page.getByTestId(chart), markers, chart)
        }
      })
    }

    const GRID_DASH = '3 3'

    test('each chart draws the result markers as labeled dashed lines with a kind legend, stacked without overlap', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await openPage(page)
      await page.getByTestId('build-order-text').fill(formatBuildOrderText(english1tc as BuildOrder))
      const response = await runSimulation(page)
      expect(response.status()).toBe(200)
      const { markers } = (await response.json()) as SimulationResult
      expect(markers.length).toBeGreaterThan(1)
      expect(markers.some((m) => m.kind === 'age-up')).toBe(true)
      expect(markers.filter((m) => m.at === markers[1].at).length).toBeGreaterThan(1)
      await expectChartsDrawn(page)

      const kinds = CHART_MARKER_KINDS.filter((k) => markers.some((m) => m.kind === k))
      for (const chart of CHARTS) {
        const root = page.getByTestId(chart)
        const lines = root.locator('svg [data-testid="chart-marker"]')
        await expect(lines).toHaveCount(markers.length)
        for (const [i, marker] of markers.entries()) {
          const line = lines.nth(i)
          await expect(line).toHaveAttribute('data-kind', marker.kind)
          await expect(line).toHaveAttribute('data-label', marker.label)
          await expect(line).toHaveAttribute('data-at', String(marker.at))
          const dash = await line.getAttribute('stroke-dasharray')
          expect(dash).toBeTruthy()
          expect(dash).not.toBe(GRID_DASH)
          await expect(line).toHaveAttribute('stroke', MARKER_COLORS[marker.kind])
        }
        expect(await root.locator('path[data-series][stroke-dasharray]').count()).toBe(0)

        const legend = root.getByTestId('chart-marker-legend')
        await expect(legend).toBeVisible()
        await expect(legend.locator('.recharts-legend-wrapper')).toHaveCount(0)
        await expect(legend.getByTestId('chart-marker-legend-item')).toHaveCount(kinds.length)
        for (const [i, kind] of kinds.entries()) {
          const item = legend.getByTestId('chart-marker-legend-item').nth(i)
          await expect(item).toHaveAttribute('data-kind', kind)
          await expect(item).toHaveText(MARKER_KIND_LABELS[kind])
          await expect(item.locator('span')).toHaveCSS('background-color', hexToRgb(MARKER_COLORS[kind]))
        }

        await expectMarkerLabelsApart(root, markers, chart)
      }

      const chart = page.getByTestId('chart-gather-rates')
      await chart.locator('li.recharts-legend-item', { hasText: 'Food' }).click()
      await expect(chart.locator('li.recharts-legend-item.inactive')).toHaveCount(1)
      await expect(chart.locator('svg [data-testid="chart-marker"]')).toHaveCount(markers.length)
      await expect(chart.getByTestId('chart-marker-legend')).toBeVisible()
    })

    test('with a pinned run the pinned lines are dashed 6 4, the current run markers 8 2, and the markers still draw', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await openPage(page)
      await page.getByTestId('build-order-text').fill(formatBuildOrderText(english1tc as BuildOrder))
      const response = await runSimulation(page)
      const { markers } = (await response.json()) as SimulationResult
      expect(markers.length).toBeGreaterThan(1)
      await page.getByTestId('pin-run').click()
      await runSimulation(page)
      await expectChartsDrawn(page)
      for (const chart of CHARTS) {
        const root = page.getByTestId(chart)
        const lines = root.locator('svg [data-testid="chart-marker"]')
        await expect(lines).toHaveCount(markers.length)
        for (const [i, marker] of markers.entries()) {
          await expect(lines.nth(i)).toHaveAttribute('data-label', marker.label)
          await expect(lines.nth(i)).toHaveAttribute('stroke-dasharray', '8 2')
        }
        const pinnedPaths = root.locator('path.recharts-line-curve[data-series][stroke-dasharray]')
        expect(await pinnedPaths.count()).toBeGreaterThan(0)
        for (const dash of await pinnedPaths.evaluateAll((els) => els.map((e) => e.getAttribute('stroke-dasharray')))) {
          expect(dash).toBe('6 4')
        }
      }
    })

    test('a shortened horizon keeps only the markers within it, on every chart', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(formatBuildOrderText(english1tc as BuildOrder))
      const full = (await (await runSimulation(page)).json()) as SimulationResult
      const cut = Math.ceil(full.markers[0].at)
      await page.getByTestId('duration-seconds').fill(String(cut))
      const { markers } = (await (await runSimulation(page)).json()) as SimulationResult
      expect(markers.length).toBeLessThan(full.markers.length)
      expect(markers.every((m) => m.at <= cut)).toBe(true)
      await expectChartsDrawn(page)
      for (const chart of CHARTS) {
        const lines = page.getByTestId(chart).locator('svg [data-testid="chart-marker"]')
        await expect(lines).toHaveCount(markers.length)
        for (const [i, marker] of markers.entries()) await expect(lines.nth(i)).toHaveAttribute('data-label', marker.label)
      }
    })

    test('a run with no markers draws no marker and no marker legend', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill('start -> sheep')
      expect((await runSimulation(page)).status()).toBe(200)
      await expectChartsDrawn(page)
      await expect(page.getByTestId('chart-marker')).toHaveCount(0)
      await expect(page.getByTestId('chart-marker-legend')).toHaveCount(0)
    })

    test('a marker at the end of the horizon is still drawn', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(formatBuildOrderText(english1tc as BuildOrder))
      const first = await runSimulation(page)
      const feudalAt = ((await first.json()) as SimulationResult).markers[0].at
      await page.getByTestId('duration-seconds').fill(String(Math.ceil(feudalAt)))
      const response = await runSimulation(page)
      const { markers, durationSeconds } = (await response.json()) as SimulationResult
      expect(markers.length).toBeGreaterThan(0)
      expect(Math.max(...markers.map((m) => m.at))).toBeLessThanOrEqual(durationSeconds)
      await expectChartsDrawn(page)
      for (const chart of CHARTS) {
        await expect(page.getByTestId(chart).locator('svg [data-testid="chart-marker"]')).toHaveCount(markers.length)
      }
    })
  })

  test.describe('step timeline', () => {
    const WAITING_PASTE = ['start -> sheep', 'build kings-palace from wood'].join('\n')
    const LONG_WAIT_PASTE = ['start 6 sheep -> sheep', 'build barracks with 9 from sheep'].join('\n')
    const ONGOING_PASTE = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x30'].join('\n')
    const rows = (page: Page) => page.getByTestId('step-timeline-row')

    test('lists one row per step with the response status, flagging the unreached ENG 1TC reaction', async ({ page }) => {
      await openPage(page)
      const result = (await (await runSimulation(page)).json()) as SimulationResult
      await expect(page.getByTestId('step-timeline')).toBeVisible()
      await expect(rows(page)).toHaveCount(result.steps.length)
      for (const timing of result.steps) {
        const row = rows(page).nth(timing.step)
        await expect(row).toHaveAttribute('data-step', String(timing.step))
        await expect(row).toHaveAttribute('data-status', timing.status)
      }
      await expect(rows(page).first()).toContainText('produce villager')
      await expect(page.locator('[data-testid="step-timeline-row"][data-reaction="true"]')).toHaveCount(1)
      const reaction = page.locator('[data-testid="step-timeline-row"][data-reaction="true"]')
      await expect(reaction).toContainText('whenever')
      await expect(reaction).toHaveAttribute('data-status', 'not-reached')
      await expect(reaction).toHaveAttribute('data-flagged', 'true')
      await expect(page.locator('[data-testid="step-timeline-row"][data-status="completed"][data-flagged]')).toHaveCount(0)
    })

    test('flags a step that cannot start with the response waitingOn', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(WAITING_PASTE)
      const result = (await (await runSimulation(page)).json()) as SimulationResult
      const timing = result.steps[0]
      expect(timing.status).toBe('waiting')
      expect(timing.waitingOn).not.toBeNull()
      const row = rows(page).first()
      await expect(row).toHaveAttribute('data-status', 'waiting')
      await expect(row).toHaveAttribute('data-flagged', 'true')
      await expect(row).toContainText(timing.waitingOn as string)
    })

    test('highlights a long wait and names the blocker in Blocked by', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(LONG_WAIT_PASTE)
      const result = (await (await runSimulation(page)).json()) as SimulationResult
      expect(result.steps[0].waitSeconds).toBeGreaterThanOrEqual(60)
      const row = rows(page).first()
      await expect(row).toHaveAttribute('data-long-wait', 'true')
      await expect(row).toHaveClass(/table-warning/)
      await expect(row.locator('td').nth(4)).toContainText('villagers 1:0')
      await expect(page.getByTestId('step-timeline').locator('th')).toHaveText(['Step', 'Started', 'Finished', 'Waited', 'Blocked by'])
      await expect(page.getByTestId('step-timeline-scroll').getByTestId('step-timeline')).toBeVisible()
    })

    test('a waiting step shows an en dash in Finished and names what it still waits on', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(WAITING_PASTE)
      const result = (await (await runSimulation(page)).json()) as SimulationResult
      const row = rows(page).first()
      await expect(row.locator('td').nth(2)).toHaveText('–')
      await expect(row.locator('td').nth(4)).toContainText(`still waiting on ${result.steps[0].waitingOn}`)
      await expect(row).not.toHaveAttribute('data-long-wait', 'true')
    })

    test('a step still running at the end of the run reads ongoing in Finished', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-text').fill(ONGOING_PASTE)
      const result = (await (await runSimulation(page)).json()) as SimulationResult
      expect(result.steps[0].status).toBe('in-progress')
      const row = rows(page).first()
      await expect(row).toHaveAttribute('data-status', 'in-progress')
      await expect(row.locator('td').nth(2)).toHaveText('ongoing')
    })

    test('editing the text after a run keeps the labels until the next run', async ({ page }) => {
      await openPage(page)
      await runSimulation(page)
      const label = rows(page).first().locator('td').first()
      const before = await label.innerText()
      await page.getByTestId('build-order-text').fill(WAITING_PASTE)
      await expect(label).toHaveText(before)
      await runSimulation(page)
      await expect(rows(page).first()).toContainText('kings-palace')
    })

    test('a 400 run and a start-only run show no timeline', async ({ page }) => {
      await openPage(page)
      await runSimulation(page)
      await expect(page.getByTestId('step-timeline')).toBeVisible()
      await page.getByTestId('build-order-text').fill(INVALID_PASTE)
      expect((await runSimulation(page)).status()).toBe(400)
      await expect(page.getByTestId('simulation-error')).toBeVisible()
      await expect(page.getByTestId('step-timeline')).toHaveCount(0)

      await page.getByTestId('build-order-text').fill('start -> sheep')
      expect((await runSimulation(page)).status()).toBe(200)
      await expect(page.getByTestId('step-timeline')).toHaveCount(0)
    })

    test('fits the table inside the page at 1280 px', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await openPage(page)
      await runSimulation(page)
      const table = await page.getByTestId('step-timeline').boundingBox()
      expect(table).not.toBeNull()
      expect((table as { x: number; width: number }).x + (table as { width: number }).width).toBeLessThanOrEqual(1280)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  })
})
