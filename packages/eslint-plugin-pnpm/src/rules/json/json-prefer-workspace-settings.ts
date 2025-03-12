import { createEslintRule } from '../../utils/create'
import { getPackageJsonRootNode } from '../../utils/iterate'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'json-prefer-workspace-settings'
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
      description: 'Prefer having pnpm settings in `pnpm-workspace.yaml` instead of `package.json`. This would requires pnpm v10.6+, see https://github.com/orgs/pnpm/discussions/9037.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          autofix: {
            type: 'boolean',
            description: 'Whether to autofix the linting error',
            default: true,
          },
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

    const workspace = getPnpmWorkspace(context.filename)
    if (!workspace)
      return {}

    context.report({
      node: pnpmNode as any,
      messageId: 'unexpectedPnpmSettings',
      fix: autofix
        ? (fixer) => {
            const json = JSON.parse(context.sourceCode.text)
            const pnpmSettings = json.pnpm

            const flatValueParis: [paths: string[], value: any][] = []
            function traverse(value: any, paths: string[]): void {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                for (const key in value) {
                  traverse(value[key], [...paths, key])
                }
              }
              else {
                flatValueParis.push([paths, value])
              }
            }
            traverse(pnpmSettings, [])

            workspace.queueChange(() => {
              for (const [paths, value] of flatValueParis) {
                workspace.setPath(paths, value)
              }
            })

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
