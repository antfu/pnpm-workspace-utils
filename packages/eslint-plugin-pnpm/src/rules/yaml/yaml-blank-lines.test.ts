import type { InvalidTestCase, ValidTestCase } from 'eslint-vitest-rule-tester'
import { runYaml } from '../../utils/_test'
import rule, { RULE_NAME } from './yaml-blank-lines'

const filename = 'pnpm-workspace.yaml'

const valids: ValidTestCase[] = [
  // Single-line entries stay packed together
  {
    filename,
    code: [
      'strictPeerDependencies: false',
      'shamefullyHoist: true',
      'shellEmulator: true',
      '',
    ].join('\n'),
  },
  // Multi-line entries are padded on both sides
  {
    filename,
    code: [
      'shellEmulator: true',
      '',
      'packages:',
      '  - packages/*',
      '',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
  },
  // Entries for the same option are grouped together, no blank line in between
  {
    filename,
    code: [
      'trustPolicy: no-downgrade',
      'trustPolicyExclude:',
      '  - cached-factory@0.1.0',
      '',
    ].join('\n'),
  },
  // ... whichever of the two comes first
  {
    filename,
    code: [
      'minimumReleaseAgeExcludePrune: true',
      'minimumReleaseAgeExclude:',
      '  - eslint-plugin-pnpm@1.9.0',
      '  - pnpm-workspace-yaml@1.9.0',
      '',
    ].join('\n'),
  },
  // A group holding a multi-line entry is padded from its neighbours as a whole
  {
    filename,
    code: [
      'shellEmulator: true',
      '',
      'minimumReleaseAgeExcludePrune: true',
      'minimumReleaseAgeExclude:',
      '  - eslint-plugin-pnpm@1.9.0',
      '',
      'shamefullyHoist: true',
      '',
    ].join('\n'),
  },
  // Nested entries are not checked, whatever spacing they have
  {
    filename,
    code: [
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '  prod:',
      '    vue: ^3.0.0',
      '',
      '  peer:',
      '    eslint: ^9.0.0',
      '',
    ].join('\n'),
  },
  // A comment in between owns the gap - packed
  {
    filename,
    code: [
      'shamefullyHoist: true',
      '# hoisting is needed for X',
      'shellEmulator: true',
      '',
      'packages:',
      '  - packages/*',
      '# and now the catalogs',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
  },
  // A comment in between owns the gap - padded, even where it is not required
  {
    filename,
    code: [
      'shamefullyHoist: true',
      '',
      '# hoisting is needed for X',
      '',
      'shellEmulator: true',
      '',
    ].join('\n'),
  },
  // A comment trailing on the previous entry's line is not "in between"
  {
    filename,
    code: [
      'shamefullyHoist: true # required',
      'shellEmulator: true',
      '',
    ].join('\n'),
  },
  // Flow collections on a single line count as single-line
  {
    filename,
    code: [
      'shellEmulator: true',
      'packages: [packages/*]',
      '',
    ].join('\n'),
  },
  // A single entry has no gaps to check
  {
    filename,
    code: 'catalogs:\n  dev:\n    vitest: ^3.0.0\n',
  },
  // Other files are left alone
  {
    filename: 'other.yaml',
    code: [
      'shellEmulator: true',
      'packages:',
      '  - packages/*',
      '',
    ].join('\n'),
  },
]

const invalids: InvalidTestCase[] = [
  // Blank line between single-line entries
  {
    filename,
    code: [
      'strictPeerDependencies: false',
      '',
      'shamefullyHoist: true',
      '',
      'shellEmulator: true',
      '',
    ].join('\n'),
    errors: [
      { messageId: 'unexpectedBlankLine', data: { key: 'shamefullyHoist' } },
      { messageId: 'unexpectedBlankLine', data: { key: 'shellEmulator' } },
    ],
    output: [
      'strictPeerDependencies: false',
      'shamefullyHoist: true',
      'shellEmulator: true',
      '',
    ].join('\n'),
  },
  // Missing blank line before a multi-line entry
  {
    filename,
    code: [
      'shellEmulator: true',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: 'catalogs' } }],
    output: [
      'shellEmulator: true',
      '',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
  },
  // Missing blank line *after* a multi-line entry
  {
    filename,
    code: [
      'packages:',
      '  - packages/*',
      'shellEmulator: true',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: 'shellEmulator' } }],
    output: [
      'packages:',
      '  - packages/*',
      '',
      'shellEmulator: true',
      '',
    ].join('\n'),
  },
  // Missing blank line between two multi-line entries
  {
    filename,
    code: [
      'packages:',
      '  - packages/*',
      'allowBuilds:',
      '  esbuild: true',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: 'allowBuilds' } }],
    output: [
      'packages:',
      '  - packages/*',
      '',
      'allowBuilds:',
      '  esbuild: true',
      '',
    ].join('\n'),
  },
  // More than one blank line is normalized down to one
  {
    filename,
    code: [
      'shellEmulator: true',
      '',
      '',
      '',
      'packages:',
      '  - packages/*',
      '',
    ].join('\n'),
    errors: [{ messageId: 'extraBlankLines', data: { key: 'packages' } }],
    output: [
      'shellEmulator: true',
      '',
      'packages:',
      '  - packages/*',
      '',
    ].join('\n'),
  },
  // A trailing comment on the previous line stays put when padding is inserted
  {
    filename,
    code: [
      'shellEmulator: true # required',
      'packages:',
      '  - packages/*',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: 'packages' } }],
    output: [
      'shellEmulator: true # required',
      '',
      'packages:',
      '  - packages/*',
      '',
    ].join('\n'),
  },
  // Quoted keys are reported by their source text
  {
    filename,
    code: [
      'shellEmulator: true',
      '\'packages\':',
      '  - packages/*',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: '\'packages\'' } }],
    output: [
      'shellEmulator: true',
      '',
      '\'packages\':',
      '  - packages/*',
      '',
    ].join('\n'),
  },
  // No blank line inside a group
  {
    filename,
    code: [
      'trustPolicy: no-downgrade',
      '',
      'trustPolicyExclude:',
      '  - cached-factory@0.1.0',
      '',
    ].join('\n'),
    errors: [{ messageId: 'unexpectedBlankLine', data: { key: 'trustPolicyExclude' } }],
    output: [
      'trustPolicy: no-downgrade',
      'trustPolicyExclude:',
      '  - cached-factory@0.1.0',
      '',
    ].join('\n'),
  },
  // A shared prefix that is not a camelCase boundary is not a group
  {
    filename,
    code: [
      'catalog:',
      '  vitest: ^3.0.0',
      'catalogs:',
      '  dev:',
      '    vue: ^3.0.0',
      '',
    ].join('\n'),
    errors: [{ messageId: 'missingBlankLine', data: { key: 'catalogs' } }],
    output: [
      'catalog:',
      '  vitest: ^3.0.0',
      '',
      'catalogs:',
      '  dev:',
      '    vue: ^3.0.0',
      '',
    ].join('\n'),
  },
  // A whole file, in one autofix pass
  {
    filename,
    code: [
      'trustPolicy: no-downgrade',
      'trustPolicyExclude:',
      '  - cached-factory@0.1.0',
      'update:',
      '  ignoreDeps:',
      '    - typescript@7',
      'strictPeerDependencies: false',
      '',
      'shamefullyHoist: true',
      'packages:',
      '  - fixtures/*',
      '',
      '',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
    errors: 5,
    output: [
      'trustPolicy: no-downgrade',
      'trustPolicyExclude:',
      '  - cached-factory@0.1.0',
      '',
      'update:',
      '  ignoreDeps:',
      '    - typescript@7',
      '',
      'strictPeerDependencies: false',
      'shamefullyHoist: true',
      '',
      'packages:',
      '  - fixtures/*',
      '',
      'catalogs:',
      '  dev:',
      '    vitest: ^3.0.0',
      '',
    ].join('\n'),
  },
]

runYaml({
  name: RULE_NAME,
  rule,
  valid: valids,
  invalid: invalids,
})
