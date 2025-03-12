// @ts-check
import antfu from '@antfu/eslint-config'
import { configs, plugin } from './packages/eslint-plugin-pnpm/src/index'

export default antfu(
  {
    type: 'lib',
    formatters: true,
  },
  ...configs.recommended,
  {
    name: 'pnpm/pnpm-workspace-yaml',
    files: ['pnpm-workspace.yaml'],
    plugins: {
      pnpm: plugin,
    },
    rules: {
      'pnpm/yaml-no-unused-catalog-item': 'error',
    },
  },
)
