import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import { getMockedWorkspace, run } from '../utils/_test'
import rule, { RULE_NAME } from './valid-catalog'

const valids: ValidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({}),
  },
]

const invalids: InvalidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: {
        'react-dom': 'catalog:react-dom',
        'react': '^18.2.0',
      },
      devDependencies: {
        'react-native': 'catalog:react-native',
      },
      pnpm: {
        overrides: {
          foo: '^1.23.0',
          bar: 'catalog:bar',
        },
      },
    }, null, 2),
    errors: [
      { messageId: 'invalidCatalog' },
      { messageId: 'invalidCatalog' },
      { messageId: 'invalidCatalog' },
    ],
    output: async (value) => {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "react-dom": "catalog:react-dom",
              "react": "^18.2.0"
            },
            "devDependencies": {
              "react-native": "catalog:react-native"
            },
            "pnpm": {
              "overrides": {
                "foo": "^1.23.0",
                "bar": "catalog:bar"
              }
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalogs:
            react-dom:
              react-dom: ^0.0.0
            react-native:
              react-native: ^0.0.0
            bar:
              bar: ^0.0.0
          "
        `)
    },
  },
]

run({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
