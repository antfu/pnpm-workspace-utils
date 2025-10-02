import type { Scalar as YAMLScalar } from 'yaml'
import { basename, normalize } from 'pathe'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-no-duplicate-catalog-item'
export type MessageIds = 'duplicateCatalogItem'
export type Options = [
  {
    allow?: string[]
    checkDuplicates?: 'name-only' | 'exact-version'
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate catalog items in `pnpm-workspace.yaml`',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
          },
          checkDuplicates: {
            type: 'string',
            enum: ['name-only', 'exact-version'],
            description: 'Determines what constitutes a duplicate: "name-only" errors on any duplicate package name, "exact-version" only errors on identical version strings',
            default: 'name-only',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      duplicateCatalogItem: 'Catalog item "{{name}}" with version "{{version}}" is already defined in the "{{existingCatalog}}" catalog. You may want to remove one of them.',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const workspace = getPnpmWorkspace(context)
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {}

    if (workspace.hasChanged() || workspace.hasQueue())
      return {}

    const { allow = [], checkDuplicates = 'name-only' } = options

    workspace.setContent(context.sourceCode.text)
    const json = workspace.toJSON() || {}
    const exists = new Map<string, { catalog: string, version: string }>()

    const catalogs = {
      ...json.catalogs,
      default: json.catalog ?? json.catalogs?.default,
    }

    const doc = workspace.getDocument()
    for (const [catalog, object] of Object.entries(catalogs)) {
      if (!object)
        continue

      for (const [key, version] of Object.entries(object)) {
        if (allow.includes(key))
          continue

        const existing = exists.get(key)
        if (existing) {
          // Determine if this is a duplicate based on the check mode
          const isDuplicate = checkDuplicates === 'name-only'
            ? true // Any duplicate package name is an error
            : existing.version === version // Only identical versions are errors

          if (isDuplicate) {
            const node = doc.getIn(catalog === 'default' ? (json.catalog ? ['catalog', key] : ['catalogs', catalog, key]) : ['catalogs', catalog, key], true)! as YAMLScalar
            const start = context.sourceCode.getLocFromIndex(node.range![0])
            const end = context.sourceCode.getLocFromIndex(node.range![1])
            context.report({
              loc: {
                start,
                end,
              },
              messageId: 'duplicateCatalogItem',
              data: {
                name: key,
                version: String(version),
                currentCatalog: catalog,
                existingCatalog: existing.catalog,
              },
            })
          }
        }
        else {
          exists.set(key, { catalog, version: String(version) })
        }
      }
    }

    return {}
  },
})
