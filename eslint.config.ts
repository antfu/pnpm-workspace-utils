// @ts-check
import antfu from '@antfu/eslint-config'
import plugin from './packages/eslint-plugin-pnpm-catalogs/src/index'

export default antfu(
  {
    type: 'lib',
  },
  {
    files: ['**/package.json'],
    plugins: {
      'pnpm-catalogs': plugin,
    },
    rules: {
      'pnpm-catalogs/enforce-catalog': 'error',
    },
  },
)
