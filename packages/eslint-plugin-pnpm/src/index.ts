import type { ESLint } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
  rules,
}

export const configs = {
  recommended: [
    {
      name: 'pnpm-catalogs:package.json',
      files: [
        'package.json',
        '**/package.json',
      ],
      languageOptions: {
        parser: jsoncParser,
      },
      plugins: {
        'pnpm-catalogs': plugin,
      },
      rules: {
        'pnpm-catalogs/enforce-catalog': 'error',
        'pnpm-catalogs/valid-catalog': 'error',
      },
    },
  ],
} satisfies ESLint.Plugin['configs']

plugin.configs = configs
export default plugin
