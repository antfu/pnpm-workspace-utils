import { createEslintRule } from '../utils'
import { iterateDependencies } from './_iterate'
import { addToQueue, getDoc } from './_queue'

export const RULE_NAME = 'valid-catalog'
export type MessageIds = 'invalidCatalog' | 'noPnpmWorkspaceYaml'
export type Options = [
  {
    autofix?: boolean
    autoInsert?: boolean
    autoInsertDefaultCatalog?: string
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
          autoInsertDefaultCatalog: {
            type: 'string',
            description: 'Default catalog to use when auto inserting to catalog',
            default: 'default',
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
      noPnpmWorkspaceYaml: 'No `pnpm-workspace.yaml` found.',
      invalidCatalog: 'Catalog "{{specifier}}" for package "{{packageName}}" is not defined in `pnpm-workspace.yaml`.',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      autoInsert = true,
      autofix = true,
      autoInsertDefaultSpecifier = '^0.0.0',
      autoInsertDefaultCatalog = 'default',
    } = options || {}

    for (const { packageName, specifier, property } of iterateDependencies(context)) {
      if (!specifier.startsWith('catalog:'))
        continue

      const doc = getDoc()
      if (!doc) {
        context.report({
          node: property.value as any,
          messageId: 'noPnpmWorkspaceYaml',
        })
        return {}
      }

      const catalogName = specifier.replace(/^catalog:/, '').trim() || 'default'
      const existingCatalogs = doc.getPackageCatalogs(packageName)
      if (!existingCatalogs.includes(catalogName)) {
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
                  catalog = autoInsertDefaultCatalog
                  // In a case this might conflicts with the `enforce-catalog` rule,
                  // we set pre to have lower priority
                  addToQueue(() => {
                    doc.setPackage(catalog, packageName, autoInsertDefaultSpecifier)
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
