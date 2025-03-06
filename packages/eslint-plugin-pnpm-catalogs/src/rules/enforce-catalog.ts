import type { AST } from 'jsonc-eslint-parser'
import { createEslintRule } from '../utils'
import { addToQueue, getDoc } from './_queue'

export const RULE_NAME = 'enforce-catalog'
export type MessageIds = 'expectCatalog' | 'noPnpmWorkspaceYaml'
export type Options = [
  {
    allowedProtocols?: string[]
    autofix?: boolean
    defaultCatalog?: string
    reuseExistingCatalog?: boolean
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce using "catalog:" in `package.json`',
    },
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        properties: {
          allowedProtocols: {
            type: 'array',
            description: 'Allowed protocols in specifier to not be converted to catalog',
            items: {
              type: 'string',
            },
          },
          autofix: {
            type: 'boolean',
            description: 'Whether to autofix the linting error',
            default: false,
          },
          defaultCatalog: {
            type: 'string',
            description: 'Default catalog to use when moving version to catalog with autofix',
          },
          reuseExistingCatalog: {
            type: 'boolean',
            description: 'Whether to reuse existing catalog when moving version to catalog with autofix',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noPnpmWorkspaceYaml: 'No `pnpm-workspace.yaml` found.',
      expectCatalog: 'Expect to use catalog instead of plain version, got "{{version}}".',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      allowedProtocols = ['workspace', 'link', 'file'],
      defaultCatalog = 'default',
      autofix = true,
      reuseExistingCatalog = true,
    } = options || {}
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

        const key = String(property.key.value)
        const value = String(property.value.value)

        if (value.startsWith('catalog:'))
          continue
        if (allowedProtocols?.some(p => value.startsWith(p)))
          continue

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
          fix: autofix
            ? (fixer) => {
                const catalog = reuseExistingCatalog
                  ? (doc.getPackageCatalogs(key)[0] || defaultCatalog)
                  : defaultCatalog

                addToQueue(() => {
                  doc.setPackage(catalog, key, value)
                })
                return fixer.replaceText(
                  property.value as any,
                  catalog === 'default' ? JSON.stringify('catalog:') : JSON.stringify(`catalog:${catalog}`),
                )
              }
            : undefined,
        })
      }
    }

    return {}
  },
})
