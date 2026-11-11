import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect } from '@playwright/test'
import { postSimulate } from './helpers'

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const issueSchema = spec.components.schemas.BuildOrderIssue

const WARM_UP_TIMEOUT_MS = 60_000
test.describe.configure({ timeout: 60_000 })

test.describe('BuildOrderIssue in the OpenAPI document', () => {
  test('suggestion is an optional string property and the document version is 2.5.0', () => {
    expect(issueSchema.properties.suggestion.type).toBe('string')
    expect(issueSchema.required).not.toContain('suggestion')
    expect(spec.info.version).toBe('2.5.0')
  })

  test('the issue schema is closed so an undocumented key would be rejected', () => {
    expect(issueSchema.additionalProperties).toBe(false)
    expect(Object.keys(issueSchema.properties).sort()).toEqual(['code', 'line', 'message', 'step', 'suggestion'])
  })
})

test.describe('simulate route issue responses', () => {
  const buildOrder = { civ: 'english', name: 'Test', start: { villagers: { sheep: 6 }, rally: 'sheep' }, steps: [{ action: 'produce', producer: 'stable', unit: 'knigt' }] }

  test('an unknown unit is still one 400 unknown-id issue on its step with only documented keys', async ({ request }) => {
    const response = await postSimulate(request, { buildOrder }, WARM_UP_TIMEOUT_MS)
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.issues).toHaveLength(1)
    const [issue] = body.issues
    expect(issue.code).toBe('unknown-id')
    expect(issue.step).toBe(0)
    expect(issue.line).toBeUndefined()
    expect(issue.message).toContain('knigt')
    expect(body.error).toBe(issue.message)
    for (const key of Object.keys(issue)) {
      expect(Object.keys(issueSchema.properties), key).toContain(key)
    }
  })

  // The 20,000-character paste cap is the page-side conversion's; lib/aoe4-build-order/text-to-build.test.ts covers it.
})
