// @ts-check
import antfu from '@antfu/eslint-config'
import { configs } from './packages/eslint-plugin-pnpm/src/index'

export default antfu(
  {
    type: 'lib',
    formatters: true,
    pnpm: false,
  },
  ...configs.recommended,
  ...configs.yaml,
  {
    name: 'pnpm/pnpm-workspace-yaml/2',
    files: ['pnpm-workspace.yaml'],
    rules: {
      'pnpm/yaml-enforce-settings': ['error', {
        settings: {
          shellEmulator: true,
          trustPolicy: 'no-downgrade',
          catalogMode: 'prefer',
          cleanupUnusedCatalogs: true,
        },
      }],
    },
  },
)
