import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { expect, type APIResponse } from '@playwright/test'
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020'

export const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
export const schemas = spec.components.schemas

// The URL of every route file under pages/api: the extension and a trailing /index dropped, [x] written {x}.
export function routeFilePaths(): string[] {
  return readdirSync(join(__dirname, '..', 'pages', 'api'), { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|js)$/.test(file))
    .map((file) => `/api/${file.replaceAll('\\', '/')}`.replace(/\.(ts|js)$/, '').replace(/\/index$/, '').replace(/\[([^\]]+)\]/g, '{$1}'))
    .sort()
}

const ajv = new Ajv2020({ strict: false })
ajv.addSchema(spec, 'openapi.json')

export function validator(name: string): ValidateFunction {
  const validate = ajv.getSchema(`openapi.json#/components/schemas/${name}`)
  if (!validate) throw new Error(`no schema ${name} in docs/api/openapi.json`)
  return validate
}

export function expectValid(name: string, data: unknown) {
  const validate = validator(name)
  expect(validate(data), JSON.stringify(validate.errors)).toBe(true)
}

export function expectInvalid(name: string, data: unknown) {
  expect(validator(name)(data)).toBe(false)
}

export const keys = (value: object) => Object.keys(value).sort()

export type Examples = Record<string, { value: any }>

export const examples = (operation: any, status: string): Examples => operation.responses[status].content['application/json'].examples

export async function expectBody(response: APIResponse, status: number, example: { value: unknown }) {
  expect(response.status(), await response.text()).toBe(status)
  expect(await response.json()).toEqual(example.value)
}

// Every component schema name that a path or another schema points to with a $ref.
export function referencedSchemaNames(): Set<string> {
  const referenced = new Set<string>()
  const walk = (node: unknown, owner: string | null) => {
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const target = key === '$ref' && typeof value === 'string' ? value.replace('#/components/schemas/', '') : null
      if (target !== null && target !== owner) referenced.add(target)
      walk(value, owner)
    }
  }
  walk(spec.paths, null)
  for (const [name, schema] of Object.entries(schemas)) walk(schema, name)
  return referenced
}
