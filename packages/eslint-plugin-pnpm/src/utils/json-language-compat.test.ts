import jsonLanguagePlugin from '@eslint/json'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { rules } from '../rules/json'
import { getMockedWorkspace } from './_test'

// Regression test for https://github.com/antfu/pnpm-workspace-utils/issues/38
//
// When `package.json` is linted with the `json/json` language from
// `@eslint/json` (as recommended when linting JSON files with other rules,
// e.g. `@eslint/json`'s own rules), the AST exposed on `context.sourceCode`
// is produced by the Momoa parser, not `jsonc-eslint-parser`. Previously our
// rules assumed the `jsonc-eslint-parser` AST shape unconditionally and
// crashed instead of linting.
describe('compatibility with `@eslint/json` `json/json` language', () => {
  function createLinter(): Linter {
    const linter = new Linter()
    return linter
  }

  const baseConfig = {
    files: ['**/*.json'],
    plugins: {
      json: jsonLanguagePlugin,
      pnpm: { rules },
    },
    language: 'json/json',
  } as const

  it('does not crash and reports violations for `pnpm/json-enforce-catalog`', () => {
    getMockedWorkspace().setContent(`
      catalogs:
        custom:
          react: ^18.2.0
    `)

    const linter = createLinter()
    const code = JSON.stringify({
      dependencies: {
        react: '^18.2.0',
      },
    }, null, 2)

    const messages = linter.verify(code, {
      ...baseConfig,
      rules: {
        'pnpm/json-enforce-catalog': 'error',
      },
    } as any, { filename: 'package.json' })

    expect(messages).toHaveLength(1)
    expect(messages[0].ruleId).toBe('pnpm/json-enforce-catalog')
  })

  it('does not crash and autofixes with `pnpm/json-enforce-catalog`', () => {
    getMockedWorkspace().setContent(`
      catalogs:
        custom:
          react: ^18.2.0
    `)

    const linter = createLinter()
    const code = JSON.stringify({
      dependencies: {
        react: '^18.2.0',
      },
    }, null, 2)

    const result = linter.verifyAndFix(code, {
      ...baseConfig,
      rules: {
        'pnpm/json-enforce-catalog': 'error',
      },
    } as any, { filename: 'package.json' })

    expect(result.output).toMatchInlineSnapshot(`
      "{
        "dependencies": {
          "react": "catalog:"
        }
      }"
    `)
  })

  it('does not crash and reports violations for `pnpm/json-prefer-workspace-settings`', () => {
    getMockedWorkspace().setContent('')

    const linter = createLinter()
    const code = JSON.stringify({
      pnpm: {
        overrides: {
          foo: '1.0.0',
        },
      },
    }, null, 2)

    const messages = linter.verify(code, {
      ...baseConfig,
      rules: {
        'pnpm/json-prefer-workspace-settings': 'error',
      },
    } as any, { filename: 'package.json' })

    expect(messages).toHaveLength(1)
    expect(messages[0].ruleId).toBe('pnpm/json-prefer-workspace-settings')
  })

  it('does not crash and reports violations for `pnpm/json-valid-catalog`', () => {
    getMockedWorkspace().setContent('')

    const linter = createLinter()
    const code = JSON.stringify({
      dependencies: {
        react: 'catalog:does-not-exist',
      },
    }, null, 2)

    const messages = linter.verify(code, {
      ...baseConfig,
      rules: {
        'pnpm/json-valid-catalog': 'error',
      },
    } as any, { filename: 'package.json' })

    expect(messages).toHaveLength(1)
    expect(messages[0].ruleId).toBe('pnpm/json-valid-catalog')
  })

  it('is still compatible with `@eslint/json`\'s own rules on the same file', () => {
    getMockedWorkspace().setContent('')

    const linter = createLinter()
    const code = '{ "a": 1, "a": 2 }'

    const messages = linter.verify(code, {
      ...baseConfig,
      rules: {
        'json/no-duplicate-keys': 'error',
        'pnpm/json-enforce-catalog': 'error',
      },
    } as any, { filename: 'package.json' })

    expect(messages.map(m => m.ruleId)).toEqual(['json/no-duplicate-keys'])
  })
})
