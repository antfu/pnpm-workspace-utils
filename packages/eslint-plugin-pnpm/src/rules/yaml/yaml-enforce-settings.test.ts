import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { $ } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-enforce-settings'

const valids: ValidTestCase[] = [
  // Required fields present
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      catalogs: {
        prod: {
          react: '*',
        },
      },
    }),
    options: [{ requiredFields: ['packages', 'catalogs'] }],
  },
  // settings settings match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['esbuild'],
      ignoreWorkspaceRootCheck: false,
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild'] } }],
  },
  // Both required fields and settings settings match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['esbuild'],
      patchedDependencies: {},
    }),
    options: [
      {
        requiredFields: ['packages'],
        settings: { onlyBuiltDependencies: ['esbuild'], patchedDependencies: {} },
      },
    ],
  },
  // String value match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      linkWorkspacePackages: true,
    }),
    options: [{ settings: { linkWorkspacePackages: true } }],
  },
  // Boolean value match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      sharedWorkspaceLockfile: false,
    }),
    options: [{ settings: { sharedWorkspaceLockfile: false } }],
  },
  // Number value match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      hoistPattern: ['*'],
    }),
    options: [{ settings: { hoistPattern: ['*'] } }],
  },
  // Nested object match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {
        'foo@1.0.0': 'patches/foo@1.0.0.patch',
      },
    }),
    options: [{ settings: { patchedDependencies: { 'foo@1.0.0': 'patches/foo@1.0.0.patch' } } }],
  },
  // Empty array match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: [],
    }),
    options: [{ settings: { onlyBuiltDependencies: [] } }],
  },
  // Empty object match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {},
    }),
    options: [{ settings: { patchedDependencies: {} } }],
  },
  // Complex nested catalogs structure
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      catalogs: {
        prod: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
        },
        dev: {
          '@types/node': '^20.0.0',
        },
      },
    }),
    options: [{
      settings: {
        catalogs: {
          prod: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
          },
          dev: {
            '@types/node': '^20.0.0',
          },
        },
      },
    }],
  },
  // Forbidden fields not present (valid)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['esbuild'],
    }),
    options: [{ forbiddenFields: ['patchedDependencies', 'catalogs'] }],
  },
  // All three options together - valid case
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['esbuild'],
    }),
    options: [{
      requiredFields: ['packages'],
      settings: { onlyBuiltDependencies: ['esbuild'] },
      forbiddenFields: ['patchedDependencies'],
    }],
  },
  // Array with multiple items match
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['esbuild', 'vite', 'rollup'],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild', 'vite', 'rollup'] } }],
  },
]

const invalids: InvalidTestCase[] = [
  {
    name: 'Missing required fields',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
    options: [{
      requiredFields: ['packages', 'catalogs'],
    }],
    errors: [
      {
        messageId: 'requiredFieldsMissing',
        data: { keys: '"catalogs"' },
      },
    ],
  },
  {
    name: 'Multiple missing required fields',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
    options: [{
      requiredFields: ['packages', 'catalogs', 'patchedDependencies'],
    }],
    errors: [
      {
        messageId: 'requiredFieldsMissing',
        data: { keys: '"catalogs", "patchedDependencies"' },
      },
    ],
  },
  {
    name: 'Missing settings setting',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild'] } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: 'undefined',
        },
      },
    ],
  },
  {
    name: 'Mismatched settings setting value',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite'],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild'] } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: JSON.stringify(['vite']),
        },
      },
    ],
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "packages:
          - packages/*

        onlyBuiltDependencies:
          - esbuild
        "
      `)
    },
  },
  {
    name: 'Mismatched boolean value',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      linkWorkspacePackages: false,
    }),
    options: [{ settings: { linkWorkspacePackages: true } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'linkWorkspacePackages',
          expected: 'true',
          actual: 'false',
        },
      },
    ],
  },
  {
    name: 'Multiple mismatched settings settings',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite'],
      linkWorkspacePackages: false,
    }),
    options: [
      {
        settings: {
          onlyBuiltDependencies: ['esbuild'],
          linkWorkspacePackages: true,
        },
      },
    ],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: '["esbuild"]',
          actual: '["vite"]',
        },
      },
      {
        messageId: 'settingMismatch',
        data: {
          key: 'linkWorkspacePackages',
          expected: 'true',
          actual: 'false',
        },
      },
    ],
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "packages:
          - packages/*

        onlyBuiltDependencies:
          - esbuild

        linkWorkspacePackages: true

        "
      `)
    },
  },
  {
    name: 'Both missing required fields and mismatched settings settings',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite'],
    }),
    options: [
      {
        requiredFields: ['catalogs'],
        settings: { onlyBuiltDependencies: ['esbuild'] },
      },
    ],
    verifyAfterFix: false,
    errors: [
      {
        messageId: 'requiredFieldsMissing',
        data: { keys: '"catalogs"' },
      },
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: JSON.stringify(['vite']),
        },
      },
    ],
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "packages:
          - packages/*

        onlyBuiltDependencies:
          - esbuild
        "
      `)
    },
  },
  {
    name: 'Autofix disabled - should not provide fix',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite'],
    }),
    options: [
      {
        autofix: false,
        settings: { onlyBuiltDependencies: ['esbuild'] },
      },
    ],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: JSON.stringify(['vite']),
        },
      },
    ],
  },
  {
    name: 'Forbidden field found',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {
        'foo@1.0.0': 'patches/foo.patch',
      },
    }),
    options: [{ forbiddenFields: ['patchedDependencies'] }],
    errors: [
      {
        messageId: 'forbiddenFieldFound',
        data: { key: 'patchedDependencies' },
      },
    ],
  },
  {
    name: 'Multiple forbidden fields found',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {},
      catalogs: {
        prod: { react: '*' },
      },
    }),
    options: [{ forbiddenFields: ['patchedDependencies', 'catalogs'] }],
    errors: [
      {
        messageId: 'forbiddenFieldFound',
        data: { key: 'patchedDependencies' },
      },
      {
        messageId: 'forbiddenFieldFound',
        data: { key: 'catalogs' },
      },
    ],
  },
  {
    name: 'Mismatched nested object',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {
        'foo@1.0.0': 'patches/foo.patch',
      },
    }),
    options: [{ settings: { patchedDependencies: { 'bar@2.0.0': 'patches/bar.patch' } } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'patchedDependencies',
          expected: JSON.stringify({ 'bar@2.0.0': 'patches/bar.patch' }),
          actual: JSON.stringify({ 'foo@1.0.0': 'patches/foo.patch' }),
        },
      },
    ],
  },
  {
    name: 'Mismatched array order',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite', 'esbuild'],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild', 'vite'] } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild', 'vite']),
          actual: JSON.stringify(['vite', 'esbuild']),
        },
      },
    ],
  },
  {
    name: 'Mismatched empty array vs non-empty',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: [],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild'] } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: '[]',
        },
      },
    ],
  },
  {
    name: 'Mismatched empty object vs non-empty',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {},
    }),
    options: [{ settings: { patchedDependencies: { 'foo@1.0.0': 'patches/foo.patch' } } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'patchedDependencies',
          expected: JSON.stringify({ 'foo@1.0.0': 'patches/foo.patch' }),
          actual: '{}',
        },
      },
    ],
  },
  {
    name: 'Mismatched complex nested catalogs',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      catalogs: {
        prod: {
          react: '^17.0.0',
        },
      },
    }),
    options: [{
      settings: {
        catalogs: {
          prod: {
            react: '^18.0.0',
          },
        },
      },
    }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'catalogs',
          expected: JSON.stringify({ prod: { react: '^18.0.0' } }),
          actual: JSON.stringify({ prod: { react: '^17.0.0' } }),
        },
      },
    ],
  },
  {
    name: 'All three options - missing required, mismatched settings, and forbidden field',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      onlyBuiltDependencies: ['vite'],
      patchedDependencies: {},
    }),
    options: [
      {
        requiredFields: ['catalogs'],
        settings: { onlyBuiltDependencies: ['esbuild'] },
        forbiddenFields: ['patchedDependencies'],
      },
    ],
    verifyAfterFix: false,
    errors: [
      {
        messageId: 'requiredFieldsMissing',
        data: { keys: '"catalogs"' },
      },
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: JSON.stringify(['vite']),
        },
      },
      {
        messageId: 'forbiddenFieldFound',
        data: { key: 'patchedDependencies' },
      },
    ],
  },
  {
    name: 'Missing setting with null value',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      linkWorkspacePackages: null,
    }),
    options: [{ settings: { linkWorkspacePackages: true } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'linkWorkspacePackages',
          expected: 'true',
          actual: 'null',
        },
      },
    ],
  },
  {
    name: 'Mismatched number value',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      someNumber: 42,
    }),
    options: [{ settings: { someNumber: 100 } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'someNumber',
          expected: '100',
          actual: '42',
        },
      },
    ],
  },
  {
    name: 'Mismatched string value',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      someString: 'foo',
    }),
    options: [{ settings: { someString: 'bar' } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'someString',
          expected: JSON.stringify('bar'),
          actual: JSON.stringify('foo'),
        },
      },
    ],
  },
  {
    name: 'Autofix for missing setting at start of file',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
    options: [{ settings: { onlyBuiltDependencies: ['esbuild'] } }],
    errors: [
      {
        messageId: 'settingMismatch',
        data: {
          key: 'onlyBuiltDependencies',
          expected: JSON.stringify(['esbuild']),
          actual: 'undefined',
        },
      },
    ],
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "
        onlyBuiltDependencies:
          - esbuild
        packages:
          - packages/*
        "
      `)
    },
  },
  {
    name: 'Forbidden field with required field - forbidden takes precedence',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      patchedDependencies: {},
    }),
    options: [
      {
        requiredFields: ['packages'],
        forbiddenFields: ['patchedDependencies'],
      },
    ],
    errors: [
      {
        messageId: 'forbiddenFieldFound',
        data: { key: 'patchedDependencies' },
      },
    ],
  },
  {
    name: 'Mismatched boolean value',
    filename: 'pnpm-workspace.yaml',
    code: $`

      packages:
        - packages/*

      linkWorkspacePackages: false
    `,
    options: [{
      settings: {
        catalogMode: 'prefer',
        cleanupUnusedCatalogs: true,
        shellEmulator: true,
        trustPolicy: 'no-downgrade',
      },
    }],
    errors: (errors) => {
      expect(errors.map(error => [error.messageId, error.message]))
        .toMatchInlineSnapshot(`
          [
            [
              "settingMismatch",
              "Setting "catalogMode" has mismatch value. Expected: "prefer", Actual: undefined.",
            ],
            [
              "settingMismatch",
              "Setting "cleanupUnusedCatalogs" has mismatch value. Expected: true, Actual: undefined.",
            ],
            [
              "settingMismatch",
              "Setting "shellEmulator" has mismatch value. Expected: true, Actual: undefined.",
            ],
            [
              "settingMismatch",
              "Setting "trustPolicy" has mismatch value. Expected: "no-downgrade", Actual: undefined.",
            ],
          ]
        `)
    },
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "
        trustPolicy: no-downgrade

        shellEmulator: true

        cleanupUnusedCatalogs: true

        catalogMode: prefer
        packages:
          - packages/*

        linkWorkspacePackages: false"
      `)
    },
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
