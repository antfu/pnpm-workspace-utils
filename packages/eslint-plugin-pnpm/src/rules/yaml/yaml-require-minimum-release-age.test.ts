import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import yaml from 'yaml'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-require-minimum-release-age'

const valids: ValidTestCase[] = [
  // minimumReleaseAge set with a positive number
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      minimumReleaseAge: 1000 * 60 * 60 * 24 * 3, // 3 days in ms
    }),
  },
  // minimumReleaseAge set with 1
  {
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      minimumReleaseAge: 1,
    }),
  },
  // Not pnpm-workspace.yaml - should be ignored
  {
    filename: 'package.json',
    code: JSON.stringify({ name: 'foo' }),
  },
]

const invalids: InvalidTestCase[] = [
  {
    name: 'minimumReleaseAge missing',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
    }),
    errors: [
      { messageId: 'missing' },
    ],
  },
  {
    name: 'minimumReleaseAge is 0',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      minimumReleaseAge: 0,
    }),
    errors: [
      {
        messageId: 'invalid',
        data: { value: '0' },
      },
    ],
  },
  {
    name: 'minimumReleaseAge is negative',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      minimumReleaseAge: -100,
    }),
    errors: [
      {
        messageId: 'invalid',
        data: { value: '-100' },
      },
    ],
  },
  {
    name: 'minimumReleaseAge is null',
    filename: 'pnpm-workspace.yaml',
    code: yaml.stringify({
      packages: ['packages/*'],
      minimumReleaseAge: null,
    }),
    errors: [
      {
        messageId: 'invalid',
        data: { value: 'null' },
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
