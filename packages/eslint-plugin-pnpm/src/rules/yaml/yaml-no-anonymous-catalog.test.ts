import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-no-anonymous-catalog'

const valids: ValidTestCase[] = [
  // Named catalogs only
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      catalogs: {
        prod: { vue: '^3.0.0' },
        dev: { vitest: '^3.0.0' },
      },
    }),
  },
  // `catalogs.default` is already the named syntax
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      catalogs: {
        default: { vue: '^3.0.0' },
      },
    }),
  },
  // No catalogs at all
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
  },
]

const invalids: InvalidTestCase[] = [
  // Default catalog alone
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      catalog: { vue: '^3.0.0' },
    }),
    errors: [{ messageId: 'unexpectedAnonymousCatalog' }],
  },
  // Alongside named catalogs - one report, not one per entry
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      catalog: {
        vue: '^3.0.0',
        vitest: '^3.0.0',
      },
      catalogs: {
        prod: { react: '^19.0.0' },
      },
    }),
    errors: [{ messageId: 'unexpectedAnonymousCatalog' }],
  },
  // Empty default catalog is still the wrong syntax
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      catalog: {},
    }),
    errors: [{ messageId: 'unexpectedAnonymousCatalog' }],
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
