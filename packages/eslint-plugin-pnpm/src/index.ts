import type { ESLint } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import { name, version } from '../package.json'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules,
}

export const configs = {
  recommended: [
    {
      name: 'pnpm/package.json',
      files: [
        'package.json',
        '**/package.json',
      ],
      languageOptions: {
        parser: jsoncParser,
      },
      plugins: {
        pnpm: plugin,
      },
      rules: {
        'pnpm/enforce-catalog': ['error', { enforceNoConflict: true }],
        'pnpm/valid-catalog': ['error', { enforceNoConflict: true }],
        'pnpm/prefer-workspace-settings': 'error',
      },
    },
  ],
} satisfies ESLint.Plugin['configs']

plugin.configs = configs
export default plugin
