import { createHash } from 'crypto'
import { join } from 'path'
import { defineConfig, devices } from '@playwright/test'

// Each checkout (one worktree per branch) gets its own port in 3100-3999, so parallel runs on different
// branches never collide or share a server. ACCEPTANCE_PORT overrides it.
const PORT =
  Number(process.env.ACCEPTANCE_PORT) ||
  3100 + (createHash('sha1').update(__dirname).digest().readUInt16BE(0) % 900)

// `env` replaces the inherited environment, so copy it. Acceptance runs write builds under test-results/ and
// never reach Vercel Blob or answer DELETE as production does, whatever the developer's shell sets.
const DROPPED_ENV = ['BUILDS_STORE_ID', 'VERCEL_ENV']
const webServerEnv: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && !DROPPED_ENV.includes(entry[0])),
  ),
  BUILDS_LOCAL_DIR: join(__dirname, 'test-results', 'builds-local'),
}

export default defineConfig({
  testDir: 'acceptance',
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: webServerEnv,
    timeout: 120_000,
  },
})
