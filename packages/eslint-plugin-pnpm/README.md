# eslint-plugin-pnpm

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

ESLint plugin to enforce and auto-fix pnpm catalogs.

This plugin consists of two set of rules that applies to `package.json` and `pnpm-workspace.yaml` respectively.

- [`json-` rules](./src/rules/json) applies to `package.json` and requires [`jsonc-eslint-parser`](https://github.com/ota-meshi/jsonc-eslint-parser) to be used as parser.
  - The `json-` rules also work when `package.json` is linted with the `json/json` language from [`@eslint/json`](https://github.com/eslint/json) instead (e.g. when combined with other JSON-linting plugins), via the bundled [`eslint-json-compat-utils`](https://github.com/ota-meshi/eslint-json-compat-utils) — you don't need to install or configure that compat package yourself.
- [`yaml-` rules](./src/rules/yaml) applies to `pnpm-workspace.yaml` and requires a YAML parser/language to be set (e.g. [`yaml-eslint-parser`](https://github.com/ota-meshi/yaml-eslint-parser), or the `yml/yaml` language from [`eslint-plugin-yml`](https://github.com/ota-meshi/eslint-plugin-yml)). These rules only read the raw source text, so any config that gets `pnpm-workspace.yaml` parsed as YAML works.
  - YAML support is still experimental as it might have race conditions with other plugins.

> [!TIP]
> Already linting `**/*.json` and `**/*.yaml` with `@eslint/json` / `eslint-plugin-yml`? You likely don't need to install `jsonc-eslint-parser` or `yaml-eslint-parser` yourself — see [Combining with JSON/YAML linting](#combining-with-jsonyaml-linting) below.

## Setup

```bash
pnpm add -D eslint-plugin-pnpm
```

### Basic Usage

```js
// eslint.config.mjs
import { configs } from 'eslint-plugin-pnpm'

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  ...configs.json,
  ...configs.yaml,
]
```

### Manual Configuration

```js
// eslint.config.mjs
import pluginPnpm from 'eslint-plugin-pnpm'
import * as jsoncParser from 'jsonc-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
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
      pnpm: pluginPnpm,
    },
    rules: {
      'pnpm/json-enforce-catalog': 'error',
      'pnpm/json-valid-catalog': 'error',
      'pnpm/json-prefer-workspace-settings': 'error',
    },
  },
  {
    name: 'pnpm/pnpm-workspace-yaml',
    files: ['pnpm-workspace.yaml'],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      pnpm: pluginPnpm,
    },
    rules: {
      'pnpm/yaml-no-unused-catalog-item': 'error',
      'pnpm/yaml-no-duplicate-catalog-item': 'error',
      'pnpm/yaml-valid-packages': 'error',
      'pnpm/yaml-no-anonymous-catalog': 'error',
    },
  },
]
```

### Combining with JSON/YAML linting

If your ESLint config already lints general `**/*.json` and `**/*.yml`/`**/*.yaml` files (e.g. with [`@eslint/json`](https://github.com/eslint/json) and [`eslint-plugin-yml`](https://github.com/ota-meshi/eslint-plugin-yml)), you don't need to install or wire up `jsonc-eslint-parser`/`yaml-eslint-parser` separately for `pnpm/*` rules. ESLint merges config objects that match the same file, so `package.json`/`pnpm-workspace.yaml` inherit the JSON/YAML language already set by your general config — the `pnpm`-specific block only needs to add its `plugins`/`rules`:

```js
// eslint.config.mjs
import { defineConfig } from 'eslint/config'
import pluginJson from '@eslint/json'
import pluginPnpm from 'eslint-plugin-pnpm'
import pluginYaml from 'eslint-plugin-yml'

export default defineConfig([
  {
    files: ['**/*.json'],
    plugins: { json: pluginJson },
    language: 'json/json',
    extends: [pluginJson.configs.recommended],
  },
  {
    files: ['**/*.yml', '**/*.yaml'],
    plugins: { yml: pluginYaml },
    extends: [pluginYaml.configs.standard],
  },
  {
    name: 'pnpm/package.json',
    files: ['package.json', '**/package.json'],
    plugins: { pnpm: pluginPnpm },
    rules: {
      'pnpm/json-enforce-catalog': 'error',
      'pnpm/json-valid-catalog': 'error',
      'pnpm/json-prefer-workspace-settings': 'error',
    },
  },
  {
    name: 'pnpm/pnpm-workspace-yaml',
    files: ['pnpm-workspace.yaml'],
    plugins: { pnpm: pluginPnpm },
    rules: {
      'pnpm/yaml-no-unused-catalog-item': 'error',
      'pnpm/yaml-no-duplicate-catalog-item': 'error',
      'pnpm/yaml-valid-packages': 'error',
      'pnpm/yaml-no-anonymous-catalog': 'error',
    },
  },
])
```

This only works if the general JSON/YAML blocks' `files` glob actually matches `package.json`/`pnpm-workspace.yaml` (the defaults above do). If you lint those files with nothing else, use the [Manual Configuration](#manual-configuration) above instead, which sets the parser directly.

## Rules

### JSON Rules (`package.json`)

- [`json-enforce-catalog`](./src/rules/json/json-enforce-catalog.ts) - Enforce catalog usage for dependencies
- [`json-valid-catalog`](./src/rules/json/json-valid-catalog.ts) - Validate catalog references in dependencies
- [`json-prefer-workspace-settings`](./src/rules/json/json-prefer-workspace-settings.ts) - Prefer workspace protocol for local dependencies

### YAML Rules (`pnpm-workspace.yaml`)

- [`yaml-no-unused-catalog-item`](./src/rules/yaml/yaml-no-unused-catalog-item.ts) - Disallow unused catalog items
- [`yaml-no-duplicate-catalog-item`](./src/rules/yaml/yaml-no-duplicate-catalog-item.ts) - Disallow duplicate catalog items
- [`yaml-no-anonymous-catalog`](./src/rules/yaml/yaml-no-anonymous-catalog.ts) - Disallow the anonymous `catalog:` in favor of named catalogs (opt-in)
- [`yaml-valid-packages`](./src/rules/yaml/yaml-valid-packages.ts) - Ensure package patterns match directories with package.json
- [`yaml-enforce-settings`](./src/rules/yaml/yaml-enforce-settings.ts) - Enforce settings in `pnpm-workspace.yaml`

## Settings

| Name                  | Description                                                 | Type    | Default |
| --------------------- | ----------------------------------------------------------- | ------- | ------- |
| `ensureWorkspaceFile` | Whether to create `pnpm-workspace.yaml` if it doesn't exist | boolean | false   |

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg' alt="antfu's sponsors"/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/eslint-plugin-pnpm?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/eslint-plugin-pnpm
[npm-downloads-src]: https://img.shields.io/npm/dm/eslint-plugin-pnpm?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/eslint-plugin-pnpm
[bundle-src]: https://img.shields.io/bundlephobia/minzip/eslint-plugin-pnpm?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=eslint-plugin-pnpm
[license-src]: https://img.shields.io/github/license/antfu/pnpm-workspace-utils.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/pnpm-workspace-utils/blob/main/LICENSE.md
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/eslint-plugin-pnpm
