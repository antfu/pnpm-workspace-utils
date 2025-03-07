import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import { getMockedWorkspace, run } from '../utils/_test'
import rule, { RULE_NAME } from './prefer-workspace-settings'

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
      pnpm: {
        patchedDependencies: {
          '@hedgedoc/markdown-it-plugins@2.1.4': 'patches/@hedgedoc__markdown-it-plugins@2.1.4.patch',
        },
        onlyBuiltDependencies: [
          'cypress',
        ],
      },
      foo: 'bar',
    }, null, 2),
    errors: [
      { messageId: 'unexpectedPnpmSettings' },
    ],
    output: async (value) => {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "foo": "bar"
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "onlyBuiltDependencies:
            - cypress
          patchedDependencies:
            '@hedgedoc/markdown-it-plugins@2.1.4': patches/@hedgedoc__markdown-it-plugins@2.1.4.patch
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
