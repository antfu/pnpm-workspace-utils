import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import { beforeEach, expect, vi } from 'vitest'
// @ts-expect-error mocked function
import { _reset, readPnpmWorkspace } from '../utils/read'
import { run } from '../utils/test'
import rule, { RULE_NAME } from './prefer-workspace-settings'

vi.mock('../utils/read', () => {
  let doc = parsePnpmWorkspaceYaml('')
  return {
    readPnpmWorkspace: () => {
      return {
        ...doc,
        write: vi.fn(),
      }
    },
    _reset() {
      doc = parsePnpmWorkspaceYaml('')
    },
  }
})

beforeEach(() => {
  _reset()
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

      // TODO: figure out why this is not working
      const pw = readPnpmWorkspace()!.toString()
      expect(pw)
        .toMatchInlineSnapshot(`
          "null
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
