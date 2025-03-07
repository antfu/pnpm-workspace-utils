import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import { getMockedWorkspace, run } from '../utils/_test'
import rule, { RULE_NAME } from './enforce-catalog'

const valids: ValidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: {
        react: 'catalog:react',
      },
      devDependencies: {
        'react-dom': 'catalog:',
      },
    }, null, 2),
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
    }, null, 2),
    errors: [
      { messageId: 'expectCatalog' },
    ],
    output: async (value) => {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "react-dom": "catalog:react-dom",
              "react": "catalog:"
            },
            "devDependencies": {
              "react-native": "catalog:react-native"
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalog:
            react: ^18.2.0
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
