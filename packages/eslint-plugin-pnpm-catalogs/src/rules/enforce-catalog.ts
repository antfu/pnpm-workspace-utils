import { createEslintRule } from '../utils'
import { iterateDependencies } from './_iterate'
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
      expectCatalog: 'Expect to use catalog instead of plain specifier, got "{{specifier}}" for package "{{packageName}}".',
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

    for (const { packageName, specifier, property } of iterateDependencies(context)) {
      if (specifier.startsWith('catalog:'))
        continue
      if (allowedProtocols?.some(p => specifier.startsWith(p)))
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
        data: {
          specifier,
          packageName,
        },
        fix: autofix
          ? (fixer) => {
              const catalog = reuseExistingCatalog
                ? (doc.getPackageCatalogs(packageName)[0] || defaultCatalog)
                : defaultCatalog

              addToQueue(() => {
                doc.setPackage(catalog, packageName, specifier)
              })
              return fixer.replaceText(
                property.value as any,
                catalog === 'default' ? JSON.stringify('catalog:') : JSON.stringify(`catalog:${catalog}`),
              )
            }
          : undefined,
      })
    }

    return {}
  },
})
