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
  // Same package in different catalogs with different versions (valid use case)
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
  },
  // Different version ranges (both valid use cases)
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
  },
]

const invalids: InvalidTestCase[] = [
  // Same package with identical version in multiple catalogs (redundant)
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
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
