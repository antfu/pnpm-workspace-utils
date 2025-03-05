import type { AST } from 'jsonc-eslint-parser'
import { createEslintRule } from '../utils'
import { addToQueue, getDoc } from './_queue'

export const RULE_NAME = 'enforce-catalog'
export type MessageIds = 'expectCatalog' | 'noPnpmWorkspaceYaml'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce using "catalog:" in `package.json`',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      noPnpmWorkspaceYaml: 'No `pnpm-workspace.yaml` found.',
      expectCatalog: 'Expect to use catalog instead of plain version, got "{{version}}".',
    },
  },
  defaultOptions: [],
  create(context) {
    if (!context.filename.endsWith('package.json'))
      return {}

    const ast = context.sourceCode.ast
    const root = ast.body[0] as unknown as AST.JSONExpressionStatement

    if (root.expression.type !== 'JSONObjectExpression')
      return {}

    for (const type of ['dependencies', 'devDependencies']) {
      const node = root.expression.properties.find(property => property.key.type === 'JSONLiteral' && property.key.value === type)
      if (!node)
        continue
      if (node.value.type !== 'JSONObjectExpression')
        continue

      for (const property of node.value.properties) {
        if (property.value.type !== 'JSONLiteral' || property.key.type !== 'JSONLiteral')
          continue
        if (typeof property.value.value !== 'string')
          continue
        if (property.value.value.match(/^(catalog|workspace|link|file):/))
          continue

        const key = String(property.key.value)
        const value = String(property.value.value)

        const doc = getDoc()
        if (!doc) {
          context.report({
            node: property.value as any,
            messageId: 'noPnpmWorkspaceYaml',
          })
          return {}
        }

        context.report({
          node: property.value as any,
          messageId: 'expectCatalog',
          fix: (fixer) => {
            addToQueue(() => {
              doc.setCatalogPackage('default', key, value)
            })
            return fixer.replaceText(property.value as any, `"catalog:"`)
          },
        })
      }
    }

    return {}
  },
})
