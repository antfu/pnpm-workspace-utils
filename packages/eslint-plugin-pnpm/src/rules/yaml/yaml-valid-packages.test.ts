import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-valid-packages'

const valids: ValidTestCase[] = [
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
      ],
    }),
  },
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        '.',
      ],
    }),
  },
  // Direct path (non-glob)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/eslint-plugin-pnpm',
        'packages/pnpm-workspace-yaml',
      ],
    }),
  },
]

const invalids: InvalidTestCase[] = [
  // Invalid types
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
        123,
        true,
        null,
      ],
    }),
    errors: [
      {
        messageId: 'invalidType',
        data: { type: 'number' },
      },
      {
        messageId: 'invalidType',
        data: { type: 'boolean' },
      },
      {
        messageId: 'invalidType',
        data: { type: 'object' },
      },
    ],
  },

  // No matches (directories don't exist)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'packages/*',
        'nonexistent/*',
        'another-missing/*',
      ],
    }),
    errors: [
      {
        messageId: 'noMatch',
        data: { pattern: 'nonexistent/*' },
      },
      {
        messageId: 'noMatch',
        data: { pattern: 'another-missing/*' },
      },
    ],
  },

  // No matches (directories exist but no package.json)
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: [
        'test/*',
      ],
    }),
    errors: [
      {
        messageId: 'noMatch',
        data: { pattern: 'test/*' },
      },
    ],
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
