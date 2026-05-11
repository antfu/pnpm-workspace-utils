import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { runJson } from '../../utils/_test'
import rule, { RULE_NAME } from './json-prefer-pnpm-overrides'

const valids: ValidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }, null, 2),
  },
  {
    filename: 'package.json',
    code: JSON.stringify({
      pnpm: {
        overrides: { lodash: '^4.17.21' },
      },
    }, null, 2),
  },
]

const invalids: InvalidTestCase[] = [
  {
    filename: 'package.json',
    code: JSON.stringify({
      resolutions: {
        lodash: '^4.17.21',
      },
    }, null, 2),
    errors: [
      { messageId: 'preferPnpmOverrides' },
    ],
  },
  {
    filename: 'package.json',
    code: JSON.stringify({
      pnpm: {
        overrides: { react: '^18.0.0' },
      },
      resolutions: {
        lodash: '^4.17.21',
      },
    }, null, 2),
    errors: [
      { messageId: 'preferPnpmOverrides' },
    ],
  },
]

runJson({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
