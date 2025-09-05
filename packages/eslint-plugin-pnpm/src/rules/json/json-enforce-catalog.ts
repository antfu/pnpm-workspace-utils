import { createEslintRule } from '../../utils/create'
import { iterateDependencies } from '../../utils/iterate'
import { getPnpmWorkspace } from '../../utils/workspace'

export type ConflictStrategy = 'new-catalog' | 'overrides' | 'error'

export const RULE_NAME = 'json-enforce-catalog'
export type MessageIds = 'expectCatalog'
export type Options = [
  {
    allowedProtocols?: string[]
    autofix?: boolean
    defaultCatalog?: string
    reuseExistingCatalog?: boolean
    conflicts?: ConflictStrategy
    fields?: string[]
    ignores?: string[]
  },
]

const DEFAULT_FIELDS = [
  'dependencies',
  'devDependencies',
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
            default: true,
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
          conflicts: {
            type: 'string',
            description: 'Strategy to handle conflicts when adding packages to catalogs',
            enum: ['new-catalog', 'overrides', 'error'],
            default: 'new-catalog',
          },
          fields: {
            type: 'array',
            description: 'Fields to check for catalog',
            items: { type: 'string' },
            default: DEFAULT_FIELDS,
          },
          ignores: {
            type: 'array',
            description: 'Ignore certain packages that require version specification',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectCatalog: 'Expect to use catalog instead of plain specifier, got "{{specifier}}" for package "{{packageName}}".',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const {
      allowedProtocols = ['workspace', 'link', 'file'],
      defaultCatalog = 'default',
      autofix = true,
      reuseExistingCatalog = true,
      conflicts = 'new-catalog',
      fields = DEFAULT_FIELDS,
      ignores = [],
    } = options || {}

    for (const { packageName, specifier, property } of iterateDependencies(context, fields)) {
      if (specifier.startsWith('catalog:') || ignores.includes(packageName))
        continue
      if (allowedProtocols?.some(p => specifier.startsWith(p)))
        continue

      const workspace = getPnpmWorkspace(context)
      if (!workspace)
        return {}

      let targetCatalog = reuseExistingCatalog
        ? (workspace.getPackageCatalogs(packageName)[0] || defaultCatalog)
        : defaultCatalog

      const resolvedConflicts = workspace.hasSpecifierConflicts(
        targetCatalog,
        packageName,
        specifier,
      )

      let shouldFix = autofix
      if (conflicts === 'error') {
        if (resolvedConflicts.conflicts) {
          shouldFix = false
        }
      }
      if (conflicts === 'new-catalog' && resolvedConflicts.conflicts) {
        targetCatalog = resolvedConflicts.newCatalogName
      }

      context.report({
        node: property.value as any,
        messageId: 'expectCatalog',
        data: {
          specifier,
          packageName,
        },
        fix: shouldFix
          ? (fixer) => {
              workspace.queueChange(() => {
                workspace.setPackage(targetCatalog, packageName, specifier)
              })

              return fixer.replaceText(
                property.value as any,
                targetCatalog === 'default'
                  ? JSON.stringify('catalog:')
                  : JSON.stringify(`catalog:${targetCatalog}`),
              )
            }
          : undefined,
      })
    }

    return {}
  },
})
