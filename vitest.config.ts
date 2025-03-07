import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: 'dot',
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
  resolve: {
    alias: {
      'pnpm-workspace-yaml': fileURLToPath(new URL('./packages/pnpm-workspace-yaml/src', import.meta.url)),
    },
  },
})
