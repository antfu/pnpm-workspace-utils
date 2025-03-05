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
})
