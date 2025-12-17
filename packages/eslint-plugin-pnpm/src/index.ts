import type { ESLint, Linter } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'
import { name, version } from '../package.json'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules,
}

const configsJson: Linter.Config[] = [
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
      'pnpm/json-enforce-catalog': 'error',
      'pnpm/json-valid-catalog': 'error',
      'pnpm/json-prefer-workspace-settings': 'error',
    },
  },
]

const configsYaml: Linter.Config[] = [
  {
    name: 'pnpm/pnpm-workspace-yaml',
    files: ['pnpm-workspace.yaml'],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      pnpm: plugin,
    },
    rules: {
      'pnpm/yaml-no-unused-catalog-item': 'error',
      'pnpm/yaml-no-duplicate-catalog-item': 'error',
      'pnpm/yaml-valid-packages': 'error',
      'pnpm/yaml-enforce-settings': [
        'error',
        { requiredFields: ['minimumReleaseAge'] },
      ],
    },
  },
]

export const configs = {
  recommended: [
    ...configsJson,
    // Yaml support is still experimental
    // ...configsYaml,
  ],
  json: configsJson,
  yaml: configsYaml,
} satisfies ESLint.Plugin['configs']

plugin.configs = configs
export default plugin
