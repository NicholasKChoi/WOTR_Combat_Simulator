import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect } from '@playwright/test'
import { postSimulate } from './helpers'

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const issueSchema = spec.components.schemas.BuildOrderIssue

const WARM_UP_TIMEOUT_MS = 60_000
test.describe.configure({ timeout: 60_000 })

test.describe('BuildOrderIssue in the OpenAPI document', () => {
  test('suggestion is an optional string property and the document version is unchanged', () => {
    expect(issueSchema.properties.suggestion.type).toBe('string')
    expect(issueSchema.required).not.toContain('suggestion')
    expect(spec.info.version).toBe('1.0.0')
  })

  test('the issue schema is closed so an undocumented key would be rejected', () => {
    expect(issueSchema.additionalProperties).toBe(false)
    expect(Object.keys(issueSchema.properties).sort()).toEqual(['code', 'line', 'message', 'step', 'suggestion'])
  })
})

test.describe('simulate route issue responses', () => {
  const paste = ['start 6 sheep -> sheep', 'produce knigt from stable'].join('\n')

  test('an unknown unit is still one 400 unknown-id issue on its paste line with only documented keys', async ({ request }) => {
    const response = await postSimulate(request, { text: paste }, WARM_UP_TIMEOUT_MS)
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.issues).toHaveLength(1)
    const [issue] = body.issues
    expect(issue.code).toBe('unknown-id')
    expect(issue.line).toBe(2)
    expect(issue.message).toContain('knigt')
    expect(body.error).toBe(issue.message)
    for (const key of Object.keys(issue)) {
      expect(Object.keys(issueSchema.properties), key).toContain(key)
    }
  })

  test('a text of 20001 characters is one out-of-range issue with the text message', async ({ request }) => {
    const response = await postSimulate(request, { text: 'x'.repeat(20_001) })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.issues).toEqual([{ code: 'out-of-range', message: 'text: 20001 characters, more than 20000' }])
  })
})
