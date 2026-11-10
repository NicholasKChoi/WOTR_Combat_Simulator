import { readFileSync } from 'fs'
import { join } from 'path'
import { expect } from '@playwright/test'
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020'

export const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
export const schemas = spec.components.schemas

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
