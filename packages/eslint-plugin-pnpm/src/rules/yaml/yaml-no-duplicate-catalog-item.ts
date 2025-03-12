import type { Scalar as YAMLScalar } from 'yaml'
import { basename, normalize } from 'pathe'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-no-duplicate-catalog-item'
export type MessageIds = 'duplicateCatalogItem'
export type Options = [
  {
    allow?: string[]
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unused catalogs in `pnpm-workspace.yaml`',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      duplicateCatalogItem: 'Catalog item "{{name}}" is already defined in the "{{existingCatalog}}" catalog. You may want to remove one of them.',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const workspace = getPnpmWorkspace(context.filename)
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {}

    if (workspace.hasChanged() || workspace.hasQueue())
      return {}

    const { allow = [] } = options

    workspace.setContent(context.sourceCode.text)
    const json = workspace.toJSON() || {}
    const exists = new Map<string, string>()

    const catalogs = {
      ...json.catalogs,
      default: json.catalog,
    }

    const doc = workspace.getDocument()
    for (const [catalog, object] of Object.entries(catalogs)) {
      if (!object)
        continue

      for (const key of Object.keys(object)) {
        if (allow.includes(key))
          continue

        if (exists.has(key)) {
          const existingCatalog = exists.get(key)!
          const node = doc.getIn(catalog === 'default' ? ['catalog', key] : ['catalogs', catalog, key], true)! as YAMLScalar
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
              currentCatalog: catalog,
              existingCatalog,
            },
          })
        }
        else {
          exists.set(key, catalog)
        }
      }
    }

    return {}
  },
})
