import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import { getMockedWorkspace, runJson } from '../../utils/_test'
import rule, { RULE_NAME } from './json-enforce-catalog'

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
        vue: '^3.6.0',
      },
    }, null, 2),
    errors: [
      { messageId: 'expectCatalog' },
    ],
    options: {
      defaultCatalog: 'default',
    },
    async before() {
      const workspace = getMockedWorkspace()
      workspace.setContent(`
        catalogs:
          default:
            vue: ^3.6.0
      `)
    },
    async output(value) {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "vue": "catalog:"
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalogs:
            default:
              vue: ^3.6.0
          "
        `)
    },
    async after() {
      getMockedWorkspace().setContent(``)
    },
  },
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
    async output(value) {
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
  {
    description: 'Version conflicts with new catalog',
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: {
        react: '^18.2.0',
      },
      devDependencies: {
        'react-native': '^5.0.0',
      },
    }, null, 2),
    errors: [
      { messageId: 'expectCatalog' },
      { messageId: 'expectCatalog' },
    ],
    async before() {
      const workspace = getMockedWorkspace()
      workspace.setContent(`
        catalog:
          react: ^18.2.0
          react-native: ^0.74.0
      `)
    },
    async output(value) {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "react": "catalog:"
            },
            "devDependencies": {
              "react-native": "catalog:conflicts_react-native_h5_0_0"
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalog:
            react: ^18.2.0
            react-native: ^0.74.0
          catalogs:
            conflicts_react-native_h5_0_0:
              react-native: ^5.0.0
          "
        `)
    },
  },
  {
    description: 'Version conflicts with overrides',
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: {
        react: '^18.2.0',
      },
      devDependencies: {
        'react-native': '^5.0.0',
      },
    }, null, 2),
    options: [
      {
        conflicts: 'overrides',
      },
    ],
    errors: [
      { messageId: 'expectCatalog' },
      { messageId: 'expectCatalog' },
    ],
    async before() {
      const workspace = getMockedWorkspace()
      workspace.setContent(`
        catalog:
          react: ^18.2.0
          react-native: ^0.74.0
      `)
    },
    async output(value) {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "react": "catalog:"
            },
            "devDependencies": {
              "react-native": "catalog:"
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalog:
            react: ^18.2.0
            react-native: ^5.0.0
          "
        `)
    },
  },
  {
    description: 'Ignores some packages',
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: {
        react: '^18.2.0',
      },
      devDependencies: {
        'react-native': '^5.0.0',
        '@types/vscode': '^1.89.0',
      },
    }, null, 2),
    options: [
      {
        ignores: ['@types/vscode'],
      },
    ],
    errors: [
      { messageId: 'expectCatalog' },
      { messageId: 'expectCatalog' },
    ],
    async output(value) {
      expect(value)
        .toMatchInlineSnapshot(`
          "{
            "dependencies": {
              "react": "catalog:"
            },
            "devDependencies": {
              "react-native": "catalog:",
              "@types/vscode": "^1.89.0"
            }
          }"
        `)

      const workspace = getMockedWorkspace()
      expect(workspace.toString())
        .toMatchInlineSnapshot(`
          "catalog:
            react: ^18.2.0
            react-native: ^5.0.0
          "
        `)
    },
  },
]

runJson({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
