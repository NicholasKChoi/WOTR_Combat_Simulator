import { createHash } from 'crypto'
import { defineConfig, devices } from '@playwright/test'

// Each checkout (one worktree per branch) gets its own port in 3100-3999, so parallel runs on different
// branches never collide or share a server. ACCEPTANCE_PORT overrides it.
const PORT =
  Number(process.env.ACCEPTANCE_PORT) ||
  3100 + (createHash('sha1').update(__dirname).digest().readUInt16BE(0) % 900)

export default defineConfig({
  testDir: 'acceptance',
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
