import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { expect } from '@playwright/test'
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
