import type { YAMLMap, Pair as YAMLPair } from 'yaml'
import { basename, normalize } from 'pathe'
import { parseDocument } from 'yaml'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-sort-catalogs'
export type MessageIds = 'unsortedCatalogs'
export type Options = [
  {
    sortCatalogNames?: boolean
    sortCatalogItems?: boolean
    defaultCatalogPosition?: 'natural' | 'first' | 'last'
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce sorted catalogs in `pnpm-workspace.yaml`',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          sortCatalogNames: {
            type: 'boolean',
            description: 'Whether to sort catalog names under `catalogs`.',
            default: true,
          },
          sortCatalogItems: {
            type: 'boolean',
            description: 'Whether to sort package names inside `catalog` and each named catalog.',
            default: false,
          },
          defaultCatalogPosition: {
            type: 'string',
            enum: ['natural', 'first', 'last'],
            description: 'Where to place the `default` named catalog when sorting catalog names.',
            default: 'natural',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unsortedCatalogs: 'Catalogs in `pnpm-workspace.yaml` should be sorted.',
    },
  },
  defaultOptions: [
    {
      sortCatalogNames: true,
      sortCatalogItems: false,
      defaultCatalogPosition: 'natural',
    },
  ],
  create(context, [options = {}]) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const workspace = getPnpmWorkspace(context)
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {}

    if (workspace.hasChanged() || workspace.hasQueue())
      return {}

    const {
      sortCatalogNames = true,
      sortCatalogItems = false,
      defaultCatalogPosition = 'natural',
    } = options

    if (!sortCatalogNames && !sortCatalogItems)
      return {}

    const sorted = sortCatalogs(context.sourceCode.text, {
      sortCatalogNames,
      sortCatalogItems,
      defaultCatalogPosition,
    })

    if (!sorted || sorted === context.sourceCode.text)
      return {}

    context.report({
      loc: {
        start: context.sourceCode.getLocFromIndex(0),
        end: context.sourceCode.getLocFromIndex(context.sourceCode.text.length),
      },
      messageId: 'unsortedCatalogs',
      fix: fixer => fixer.replaceTextRange([0, context.sourceCode.text.length], sorted),
    })

    return {}
  },
})

function sortCatalogs(
  code: string,
  options: Required<NonNullable<Options[0]>>,
): string | undefined {
  const doc = parseDocument(code)
  let changed = false

  if (options.sortCatalogItems) {
    const catalog = doc.getIn(['catalog'], true) as YAMLMap | undefined
    if (sortMap(catalog))
      changed = true
  }

  const catalogs = doc.getIn(['catalogs'], true) as YAMLMap | undefined
  if (catalogs) {
    if (options.sortCatalogItems) {
      for (const item of catalogs.items) {
        if (sortMap(item.value as YAMLMap | undefined))
          changed = true
      }
    }

    if (options.sortCatalogNames && sortMap(catalogs, options.defaultCatalogPosition))
      changed = true
  }

  return changed ? doc.toString() : undefined
}

function sortMap(
  map: YAMLMap | undefined,
  defaultCatalogPosition: 'natural' | 'first' | 'last' = 'natural',
): boolean {
  if (!map?.items || map.items.length < 2)
    return false

  const sorted = [...map.items].sort((a, b) => comparePairKeys(a, b, defaultCatalogPosition))
  if (sorted.every((item, index) => item === map.items[index]))
    return false

  moveLeadingCommentToFirstItem(map)
  map.items = sorted
  return true
}

function moveLeadingCommentToFirstItem(map: YAMLMap): void {
  if (!map.commentBefore)
    return

  const first = map.items[0]
  const key = first?.key
  if (!key || typeof key !== 'object')
    return

  const node = key as { commentBefore?: string }
  node.commentBefore = node.commentBefore
    ? `${map.commentBefore}\n${node.commentBefore}`
    : map.commentBefore
  map.commentBefore = undefined
}

function comparePairKeys(
  a: YAMLPair<unknown, unknown>,
  b: YAMLPair<unknown, unknown>,
  defaultCatalogPosition: 'natural' | 'first' | 'last',
): number {
  const left = getKeyValue(a)
  const right = getKeyValue(b)

  if (defaultCatalogPosition !== 'natural' && left !== right) {
    if (left === 'default')
      return defaultCatalogPosition === 'first' ? -1 : 1
    if (right === 'default')
      return defaultCatalogPosition === 'first' ? 1 : -1
  }

  return left.localeCompare(right)
}

function getKeyValue(pair: YAMLPair<unknown, unknown>): string {
  const key = pair.key
  if (key && typeof key === 'object' && 'value' in key)
    return String(key.value)
  return String(key)
}
