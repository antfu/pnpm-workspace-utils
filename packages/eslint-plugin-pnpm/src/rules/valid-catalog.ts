import { createEslintRule } from '../utils/create'
import { iterateDependencies } from '../utils/iterate'
import { getPnpmWorkspace } from '../utils/workspace'

export const RULE_NAME = 'valid-catalog'
export type MessageIds = 'invalidCatalog'
export type Options = [
  {
    autofix?: boolean
    autoInsert?: boolean
    autoInsertDefaultSpecifier?: string
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce using valid catalog in `package.json`',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          autoInsert: {
            type: 'boolean',
            description: 'Whether to auto insert to catalog if missing',
            default: true,
          },
          autoInsertDefaultSpecifier: {
            type: 'string',
            description: 'Default specifier to use when auto inserting to catalog',
            default: '^0.0.0',
          },
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
      invalidCatalog: 'Catalog "{{specifier}}" for package "{{packageName}}" is not defined in `pnpm-workspace.yaml`.',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      autoInsert = true,
      autofix = true,
      autoInsertDefaultSpecifier = '^0.0.0',
    } = options || {}

    for (const { packageName, specifier, property } of iterateDependencies(context)) {
      if (!specifier.startsWith('catalog:'))
        continue

      const workspace = getPnpmWorkspace()
      if (!workspace)
        return {}

      const currentCatalog = specifier.replace(/^catalog:/, '').trim() || 'default'
      const existingCatalogs = workspace.getPackageCatalogs(packageName)
      if (!existingCatalogs.includes(currentCatalog)) {
        context.report({
          node: property.value as any,
          messageId: 'invalidCatalog',
          data: {
            specifier,
            packageName,
          },
          fix: (!autofix || (!autoInsert && !existingCatalogs.length))
            ? undefined
            : (fixer) => {
                let catalog = existingCatalogs[0]
                if (!catalog && autoInsert) {
                  catalog = currentCatalog
                  // In a case this might conflicts with the `enforce-catalog` rule,
                  // we set pre to have lower priority
                  workspace.queueChange(() => {
                    workspace.setPackage(catalog, packageName, autoInsertDefaultSpecifier)
                  }, 'pre')
                }
                return fixer.replaceText(
                  property.value as any,
                  catalog === 'default'
                    ? JSON.stringify('catalog:')
                    : JSON.stringify(`catalog:${catalog}`),
                )
              },
        })
      }
    }

    return {}
  },
})
