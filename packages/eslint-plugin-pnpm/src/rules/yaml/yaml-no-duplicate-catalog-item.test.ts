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
        react7: {
          react: '^7',
        },
        react8: {
          react: '^8',
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
          react: '^18.0.0',
        },
        patch: {
          react: '~18.2.0',
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
          react: '^18.2.0',
        },
        dev: {
          react: '^18.2.0',
        },
      },
    }),
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'react', version: '^18.2.0', currentCatalog: 'dev', existingCatalog: 'prod' },
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
        react7: {
          react: '^7',
        },
        react8: {
          react: '^8',
        },
      },
    }),
    options: [{ checkDuplicates: 'name-only' }],
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'react', version: '^8', currentCatalog: 'react8', existingCatalog: 'react7' },
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
          react: '^18.0.0',
          lodash: '^4.17.0',
        },
        patch: {
          react: '~18.2.0',
          lodash: '^4.17.21',
        },
      },
    }),
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'react', version: '~18.2.0', currentCatalog: 'patch', existingCatalog: 'minor' },
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
