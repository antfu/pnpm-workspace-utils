import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { parsePnpmWorkspaceYaml } from 'pnpm-catalogs-utils'
import { beforeEach, vi } from 'vitest'
// @ts-expect-error mocked function
import { _reset } from './_doc'
import { run } from './_test'
import rule, { RULE_NAME } from './enforce-catalog'

vi.mock('./_doc', () => {
  let doc = parsePnpmWorkspaceYaml('')
  return {
    readDoc: () => {
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

// TODO: add tests
const valids: ValidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({}),
  },
]

const invalids: InvalidTestCase[] = [
  // {
  //   filename: 'package.json',
  //   code: JSON.stringify({
  //     dependencies: {
  //       'react-dom': 'catalog:react-dom',
  //       'react': '^18.2.0',
  //     },
  //     devDependencies: {
  //       'react-native': 'catalog:react-native',
  //     },
  //   }, null, 2),
  //   errors: [
  //     { messageId: 'expectCatalog' },
  //   ],
  //   output: async (value) => {
  //     expect(value)
  //       .toMatchInlineSnapshot(`
  //         "{
  //           "dependencies": {
  //             "react-dom": "catalog:react-dom",
  //             "react": "catalog:"
  //           },
  //           "devDependencies": {
  //             "react-native": "catalog:react-native"
  //           }
  //         }"
  //       `)

  //     // TODO: figure out why this is not working
  //     const pw = readDoc()!.toString()
  //     expect(pw)
  //       .toMatchInlineSnapshot(`
  //         "null
  //         "
  //       `)
  //   },
  // },
]

run({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
