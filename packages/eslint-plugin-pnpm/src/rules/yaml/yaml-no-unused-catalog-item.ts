import type { YAMLMap, Pair as YAMLPair } from 'yaml'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, normalize, resolve } from 'pathe'
import { globSync } from 'tinyglobby'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-no-unused-catalog-item'
export type MessageIds = 'unusedCatalogItem'
export type Options = [
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
    ],
    messages: {
      unusedCatalogItem: 'Catalog item "{{catalogItem}}" is not used in any package.json.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const workspace = getPnpmWorkspace(context.filename)
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {}

    if (workspace.hasChanged() || workspace.hasQueue())
      return {}

    workspace.setContent(context.sourceCode.text)
    const parsed = workspace.toJSON() || {}
    const root = resolve(dirname(context.filename))

    const entries: Map<string, YAMLPair<any, any>> = new Map()

    const doc = workspace.getDocument()
    const catalogs: Record<string, YAMLMap | undefined> = {
      default: doc.getIn(['catalog']) as YAMLMap | undefined,
    }
    for (const item of (doc.getIn(['catalogs']) as YAMLMap)?.items || [])
      catalogs[String(item.key)] = item.value as YAMLMap

    for (const [catalog, map] of Object.entries(catalogs)) {
      if (!map)
        continue

      for (const item of map.items) {
        entries.set(`${String(item.key)}:${catalog}`, item)
      }
    }

    if (entries.size === 0)
      return {}

    const dirs = parsed.packages
      ? globSync(parsed.packages, {
          cwd: root,
          dot: false,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/dist/**',
            '**/dist/**',
          ],
          absolute: true,
          expandDirectories: false,
          onlyDirectories: true,
        })
      : []
    dirs.push(root)

    const packages = dirs.map(dir => resolve(dir, 'package.json'))
      .filter(x => existsSync(x))
      .sort()

    const FIELDS = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
      'overrides',
      'resolutions',
      'pnpm.overrides',
    ]
    for (const path of packages) {
      const pkg = JSON.parse(readFileSync(path, 'utf-8'))

      for (const field of FIELDS) {
        const map = getObjectPath(pkg, field.split('.'))
        if (!map)
          continue

        for (const [name, value] of Object.entries(map)) {
          if (!value.startsWith('catalog:'))
            continue
          const catalog = value.slice(8) || 'default'
          const key = `${name}:${catalog}`
          entries.delete(key)
        }
      }
    }

    if (entries.size > 0) {
      for (const [key, value] of Array.from(entries.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        const start = context.sourceCode.getLocFromIndex(value.key.range[0])
        const end = context.sourceCode.getLocFromIndex(value.value.range.at(-1))
        context.report({
          loc: {
            start,
            end,
          },
          messageId: 'unusedCatalogItem',
          data: { catalogItem: key },
        })
      }
    }

    return {}
  },
})

function getObjectPath(obj: Record<string, any>, path: string[]): unknown | undefined {
  let current = obj
  for (const key of path) {
    current = current[key]
    if (!current)
      return undefined
  }
  return current
}
