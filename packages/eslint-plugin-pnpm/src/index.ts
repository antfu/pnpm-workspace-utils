import type { ESLint } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
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
        'pnpm/enforce-catalog': 'error',
        'pnpm/valid-catalog': 'error',
        'pnpm/prefer-workspace-settings': 'error',
      },
    },
  ],
} satisfies ESLint.Plugin['configs']

plugin.configs = configs
export default plugin
