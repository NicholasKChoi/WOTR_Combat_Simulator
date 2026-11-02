import { test, expect } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { buildOrderFrom } from './helpers'

test.describe('buildOrderFrom', () => {
  for (const build of listBuilds()) {
    test(`returns the checked order for the formatted ${build.name}`, () => {
      const order = buildOrderFrom(formatBuildOrderText(build))
      expect(order.start).toStrictEqual(build.start)
      expect(order.steps).toStrictEqual(build.steps)
    })
  }

  test('throws with the issue message for an unknown unit', () => {
    expect(() => buildOrderFrom('start -> sheep\nproduce knigt from stable')).toThrow('line 2: unknown unit "knigt" in unit')
  })
})
