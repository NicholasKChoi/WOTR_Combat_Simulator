import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['utils/**/*.test.ts', 'lib/**/*.test.ts', 'components/**/*.test.ts'],
        css: { include: [/\.module\.css$/], modules: { classNameStrategy: 'non-scoped' } },
        exclude: ['acceptance/**', 'node_modules/**', '.next/**', 'golang/**'],
    },
})
