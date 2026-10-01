import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Unit tests live in tests/unit (node) and the legacy page tests in
// __tests__ (jsdom). The `@/*` alias mirrors tsconfig.json, as in Moon.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', '__tests__/**/*.test.tsx'],
    environment: 'node',
    environmentMatchGlobs: [['__tests__/**', 'jsdom']],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
    reporters: 'default',
    // Data-layer and service suites each boot PGlite (Postgres in WASM), which
    // runs several times slower while other files run in parallel.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  // Next compiles JSX with the automatic runtime, so components need no
  // `import React`; tests render them the same way.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
