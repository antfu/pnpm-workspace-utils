// @ts-check
import antfu from '@antfu/eslint-config'
import plugin from './packages/eslint-plugin-pnpm/src/index'

export default antfu(
  {
    type: 'lib',
    formatters: true,
  },
  {
    files: ['**/package.json'],
    plugins: {
      pnpm: plugin,
    },
    rules: {
      'pnpm/enforce-catalog': 'error',
      'pnpm/valid-catalog': 'error',
    },
  },
)
