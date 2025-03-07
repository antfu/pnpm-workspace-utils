import { createEslintRule } from '../utils/create'
import { getPackageJsonRootNode } from '../utils/iterate'
import { getPnpmWorkspace } from '../utils/workspace'

export const RULE_NAME = 'prefer-workspace-settings'
export type MessageIds = 'unexpectedPnpmSettings'
export type Options = [
  {
    autofix?: boolean
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce using "catalog:" in `package.json`',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          autofix: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedPnpmSettings: 'Unexpected pnpm settings in package.json, should move to pnpm-workspace.yaml',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      autofix = true,
    } = options || {}

    const root = getPackageJsonRootNode(context)
    if (!root)
      return {}

    const pnpmNode = root.properties.find(property => property.key.type === 'JSONLiteral' && property.key.value === 'pnpm')
    if (!pnpmNode)
      return {}

    const workspace = getPnpmWorkspace()
    if (!workspace)
      return {}

    context.report({
      node: pnpmNode as any,
      messageId: 'unexpectedPnpmSettings',
      fix: autofix
        ? (fixer) => {
            const json = JSON.parse(context.sourceCode.text)
            const _value = json.pnpm

            // TODO: write to pnpm-workspace.yaml

            let start = pnpmNode.range[0]
            let end = pnpmNode.range[1]
            const before = context.sourceCode.getTokenBefore(pnpmNode as any)
            if (before)
              start = before.range[1]
            const after = context.sourceCode.getTokenAfter(pnpmNode as any)
            if (after?.type === 'Punctuator' && after.value === ',')
              end = after.range[1]
            return fixer.removeRange([start, end])
          }
        : undefined,
    })

    return {}
  },
})
