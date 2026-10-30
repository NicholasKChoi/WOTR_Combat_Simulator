import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['utils/**/*.test.ts', 'lib/**/*.test.ts', 'components/**/*.test.ts'],
        exclude: ['acceptance/**', 'node_modules/**', '.next/**', 'golang/**'],
    },
})
