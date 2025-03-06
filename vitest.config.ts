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
      'pnpm-catalogs-utils': fileURLToPath(new URL('./packages/pnpm-catalogs-utils/src', import.meta.url)),
    },
  },
})
