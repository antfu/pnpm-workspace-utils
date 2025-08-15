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
          foo: '^18.2.0',
        },
      },
    }),
    errors: [
      {
        messageId: 'duplicateCatalogItem',
        data: { name: 'foo', currentCatalog: 'default', existingCatalog: 'react' },
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
