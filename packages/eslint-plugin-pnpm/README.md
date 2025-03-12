# eslint-plugin-pnpm

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

ESLint plugin to enforce and auto-fix pnpm catalogs.

This plugin consist with two set of rules that applies to `package.json` and `pnpm-workspace.yaml` respectively.

- [`json-` rules](./src/rules/json) applies to `package.json` and requires [`jsonc-eslint-parser`](https://github.com/ota-meshi/jsonc-eslint-parser) to be used as parser.
- [`yaml-` rules](./src/rules/yaml) applies to `pnpm-workspace.yaml` and requires [`yaml-eslint-parser`](https://github.com/ota-meshi/yaml-eslint-parser) to be used as parser.
  - YAML support is still experimental as it might have race conditions with other plugins.

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
    },
  },
]
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
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
[license-src]: https://img.shields.io/github/license/antfu/eslint-plugin-pnpm.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/eslint-plugin-pnpm/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/eslint-plugin-pnpm
