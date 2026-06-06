import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-sort-catalogs'

const valids: ValidTestCase[] = [
  {
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  dev:
    typescript: ^6.0.0
  prod:
    yaml: ^2.0.0
  test:
    vitest: ^4.0.0
`,
  },
  {
    name: 'does not sort catalog items by default',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  dev:
    typescript: ^6.0.0
    eslint: ^10.0.0
`,
  },
  {
    name: 'allows disabling all sorting',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  test:
    vitest: ^4.0.0
  dev:
    typescript: ^6.0.0
`,
    options: [{ sortCatalogNames: false, sortCatalogItems: false }],
  },
]

const invalids: InvalidTestCase[] = [
  {
    name: 'sorts catalog names by default',
    filename: 'pnpm-workspace.yaml',
    code: `packages:
  - packages/*
catalogs:
  test:
    vitest: ^4.0.0
  dev:
    typescript: ^6.0.0
  prod:
    yaml: ^2.0.0
`,
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: `packages:
  - packages/*
catalogs:
  dev:
    typescript: ^6.0.0
  prod:
    yaml: ^2.0.0
  test:
    vitest: ^4.0.0
`,
  },
  {
    name: 'sorts catalog items when enabled',
    filename: 'pnpm-workspace.yaml',
    code: `catalog:
  vite: ^8.0.0
  '@types/node': ^25.0.0
catalogs:
  dev:
    typescript: ^6.0.0
    eslint: ^10.0.0
  prod:
    yaml: ^2.0.0
`,
    options: [{ sortCatalogNames: false, sortCatalogItems: true }],
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: `catalog:
  '@types/node': ^25.0.0
  vite: ^8.0.0
catalogs:
  dev:
    eslint: ^10.0.0
    typescript: ^6.0.0
  prod:
    yaml: ^2.0.0
`,
  },
  {
    name: 'sorts catalog names and items together',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  test:
    vitest: ^4.0.0
    '@vitest/ui': ^4.0.0
  dev:
    typescript: ^6.0.0
    '@types/node': ^25.0.0
    eslint: ^10.0.0
`,
    options: [{ sortCatalogNames: true, sortCatalogItems: true }],
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: `catalogs:
  dev:
    '@types/node': ^25.0.0
    eslint: ^10.0.0
    typescript: ^6.0.0
  test:
    '@vitest/ui': ^4.0.0
    vitest: ^4.0.0
`,
  },
  {
    name: 'sorts scoped and unscoped package names',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  dev:
    vite: ^8.0.0
    '@types/node': ^25.0.0
    eslint: ^10.0.0
`,
    options: [{ sortCatalogNames: false, sortCatalogItems: true }],
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: `catalogs:
  dev:
    '@types/node': ^25.0.0
    eslint: ^10.0.0
    vite: ^8.0.0
`,
  },
  {
    name: 'can keep default catalog first',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  prod:
    yaml: ^2.0.0
  default:
    react: ^19.0.0
  dev:
    typescript: ^6.0.0
`,
    options: [{ defaultCatalogPosition: 'first' }],
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: `catalogs:
  default:
    react: ^19.0.0
  dev:
    typescript: ^6.0.0
  prod:
    yaml: ^2.0.0
`,
  },
  {
    name: 'preserves comments with sorted catalog pairs',
    filename: 'pnpm-workspace.yaml',
    code: `catalogs:
  # test tools
  test:
    vitest: ^4.0.0
  # development tools
  dev:
    typescript: ^6.0.0
`,
    errors: [
      {
        messageId: 'unsortedCatalogs',
      },
    ],
    output: (out) => {
      expect(out).toMatchInlineSnapshot(`
        "catalogs:
          # development tools
          dev:
            typescript: ^6.0.0
          # test tools
          test:
            vitest: ^4.0.0
        "
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
