import { createEslintRule } from '../../utils/create'
import { getPackageJsonRootNode } from '../../utils/iterate'

export const RULE_NAME = 'json-prefer-pnpm-overrides'
export type MessageIds = 'preferPnpmOverrides'
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
      description:
        'Prefer using `pnpm.overrides` in `package.json` (or overrides in `pnpm-workspace.yaml`) instead of `resolutions`.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          autofix: {
            type: 'boolean',
            description: 'Whether to autofix by renaming `resolutions` to `pnpm.overrides`',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferPnpmOverrides:
        'Use `pnpm.overrides` instead of `resolutions`. See https://pnpm.io/package_json#pnpmoverrides.',
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

    const resolutionsNode = root.properties.find(
      property =>
        property.key.type === 'JSONLiteral' && property.key.value === 'resolutions',
    )
    if (!resolutionsNode)
      return {}

    context.report({
      node: resolutionsNode as any,
      messageId: 'preferPnpmOverrides',
      fix: autofix
        ? (fixer) => {
            const json = JSON.parse(context.sourceCode.text)
            const resolutions = json.resolutions
            const pnpm = json.pnpm || {}

            // Merge resolutions into pnpm.overrides
            pnpm.overrides = {
              ...pnpm.overrides,
              ...resolutions,
            }

            const updatedJson = { ...json }
            delete updatedJson.resolutions
            updatedJson.pnpm = pnpm

            const output = JSON.stringify(updatedJson, null, 2)
            return fixer.replaceText(root as any, output)
          }
        : undefined,
    })

    return {}
  },
})
