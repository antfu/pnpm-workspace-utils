# eslint-plugin-pnpm

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

ESLint plugin to enforce and auto-fix pnpm catalogs.

> [!IMPORTANT]
> This plugin is still in heavy development and the API is not stable. Pin your version on use.

## Setup

```bash
pnpm add -D eslint-plugin-pnpm jsonc-eslint-parser
```

### Basic Usage

```js
// eslint.config.mjs
import { configs } from 'eslint-plugin-pnpm'

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  ...configs.recommended,
]
```

### Advanced usage

```js
// eslint.config.mjs
import pluginPnpm from 'eslint-plugin-pnpm'
import * as jsoncParser from 'jsonc-eslint-parser'

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
      'pnpm/enforce-catalog': ['error', { enforceNoConflict: true }],
      'pnpm/valid-catalog': ['error', { enforceNoConflict: true }],
      'pnpm/prefer-workspace-settings': 'error',
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
