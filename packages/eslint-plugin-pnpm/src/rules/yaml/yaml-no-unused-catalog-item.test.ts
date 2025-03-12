import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-no-unused-catalog-item'

const valids: ValidTestCase[] = [
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalogs: {
        prod: {
          'find-up-simple': '*',
        },
        dev: {
          '@typescript-eslint/parser': '*',
        },
      },
    }),
  },
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: null,
      overrides: {
        foo: 'catalog:prod',
      },
      catalogs: {
        prod: {
          foo: '*',
        },
      },
    }),
  },
]

const invalids: InvalidTestCase[] = [
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
      catalog: {
        foo: 'bar',
      },
      catalogs: {
        react: {
          react: '^18.2.0',
        },
      },
    }),
    errors: [
      {
        messageId: 'unusedCatalogItem',
        data: { catalogItem: 'foo:default' },
      },
      {
        messageId: 'unusedCatalogItem',
        data: { catalogItem: 'react:react' },
      },
    ],
  },
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: null,
      overrides: {
        foo: 'catalog:prod',
        bar: '*',
      },
      catalogs: {
        prod: {
          foo: '*',
          bar: '*',
        },
      },
    }),
    errors: 1,
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
