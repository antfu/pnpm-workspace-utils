import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-no-duplicate-catalog-item'

const valids: ValidTestCase[] = [
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        prod: {
          empathic: '*',
        },
        dev: {
          '@typescript-eslint/parser': '*',
        },
      },
    }),
  },
  // Same package in different catalogs with different versions (valid with exact-version mode)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        legacy: {
          typescript: '^4',
        },
        modern: {
          typescript: '^5',
        },
      },
    }),
    options: [{ checkDuplicates: 'exact-version' }],
  },
  // Different version ranges (valid with exact-version mode)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        minor: {
          lodash: '^4.17.0',
        },
        patch: {
          lodash: '~4.17.21',
        },
      },
    }),
    options: [{ checkDuplicates: 'exact-version' }],
  },
]

const invalids: InvalidTestCase[] = [
  // Same package with identical version in multiple catalogs (error in both modes)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        prod: {
          lodash: '^4.17.21',
        },
        dev: {
          lodash: '^4.17.21',
        },
      },
    }),
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'lodash', version: '^4.17.21', currentCatalog: 'dev', existingCatalog: 'prod' },
      },
    ],
  },
  // name-only mode: Different versions still error (default behavior)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        legacy: {
          typescript: '^4',
        },
        modern: {
          typescript: '^5',
        },
      },
    }),
    options: [{ checkDuplicates: 'name-only' }],
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'typescript', version: '^5', currentCatalog: 'modern', existingCatalog: 'legacy' },
      },
    ],
  },
  // name-only mode (default): Multiple packages with different versions all error
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        minor: {
          eslint: '^8.0.0',
          lodash: '^4.17.0',
        },
        patch: {
          eslint: '~8.57.0',
          lodash: '^4.17.21',
        },
      },
    }),
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'eslint', version: '~8.57.0', currentCatalog: 'patch', existingCatalog: 'minor' },
      },
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'lodash', version: '^4.17.21', currentCatalog: 'patch', existingCatalog: 'minor' },
      },
    ],
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
