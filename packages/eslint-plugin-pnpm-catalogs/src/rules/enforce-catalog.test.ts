import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { parsePnpmWorkspaceYaml } from 'pnpm-catalogs-utils'
import { expect, vi } from 'vitest'
import { run } from './_test'
import rule, { RULE_NAME } from './enforce-catalog'

vi.mock('./_doc', () => {
  const doc = parsePnpmWorkspaceYaml('')
  return {
    readDoc: () => {
      return {
        ...doc,
        write: vi.fn(),
      }
    },
  }
})

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
    output: (value) => {
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
    },
  },
]

run({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
