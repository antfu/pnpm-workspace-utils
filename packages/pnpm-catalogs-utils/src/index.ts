import type { Alias, Document, Scalar, ToStringOptions } from 'yaml'
import { isAlias, Pair, parseDocument, visit, YAMLMap } from 'yaml'

export interface PnpmWorkspaceYamlSchema {
  packages?: string[]
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
}

export interface PnpmWorkspaceYaml {
  document: Document.Parsed
  hasChanged: () => boolean
  toJSON: () => PnpmWorkspaceYamlSchema
  toString: (options?: ToStringOptions) => string
  setCatalogPackage: (catalog: 'default' | (string & {}), packageName: string, specifier: string) => void
}

/**
 * Parse pnpm workspace yaml content, and return an object to modify the content
 * while preserving the comments, anchor, and alias.
 */
export function parsePnpmWorkspaceYaml(content: string): PnpmWorkspaceYaml {
  const countSingleQuote = content.split('\'').length - 1
  const countDoubleQuote = content.split('"').length - 1
  const document = parseDocument(content)
  let hasChanged = false

  function setCatalogPackage(catalogName: string, packageName: string, specifier: string): void {
    let catalog: YAMLMap<Scalar.Parsed | string, Scalar.Parsed | string>
    if (catalogName === 'default') {
      if (!document.has('catalog')) {
        document.set('catalog', new YAMLMap())
      }
      catalog = document.get('catalog') as YAMLMap<Scalar.Parsed, Scalar.Parsed>
    }
    else {
      if (!document.has('catalogs')) {
        document.set('catalogs', new YAMLMap())
      }
      const catalogs = document.get('catalogs') as YAMLMap
      if (!catalogs.has(catalogName)) {
        catalogs.set(catalogName, new YAMLMap())
      }
      catalog = catalogs.get(catalogName) as YAMLMap<Scalar.Parsed, Scalar.Parsed>
    }

    let pair = catalog.items.find(i => typeof i.key === 'string' ? i.key === packageName : i.key.value === packageName)
    const keys = catalog.items.map(i => typeof i.key === 'string' ? i.key : String(i.key.value))
    if (!pair) {
      let index = 0
      // Find the index to insert with sorted
      for (; index < keys.length; index++) {
        if (keys[index].localeCompare(packageName) > 0) {
          break
        }
      }
      pair = new Pair(packageName, specifier) as any
      catalog.items.splice(index, 0, pair!)
      hasChanged = true
    }
    else {
      if (isAlias(pair.value)) {
        const alias = findAnchor(document, pair.value)
        if (alias) {
          if (alias.value !== specifier) {
            alias.value = specifier
            hasChanged = true
          }
        }
      }
      else {
        if (!pair.value || typeof pair.value === 'string') {
          if (pair.value !== specifier) {
            pair.value = specifier
            hasChanged = true
          }
        }
        else {
          if (pair.value.value !== specifier) {
            pair.value.value = specifier
            hasChanged = true
          }
        }
      }
    }
  }

  return {
    document,
    hasChanged: () => hasChanged,
    toJSON: () => document.toJSON(),
    toString: (options?: ToStringOptions) => document.toString({
      singleQuote: countSingleQuote <= countDoubleQuote,
      ...options,
    }),
    setCatalogPackage,
  }
}

function findAnchor(doc: Document, alias: Alias): Scalar<string> | undefined {
  let anchor: Scalar<string> | undefined

  visit(doc, {
    Scalar: (_key, scalar, _path) => {
      if (
        scalar.anchor === alias.source
        && typeof scalar.value === 'string'
      ) {
        anchor = scalar as Scalar<string>
      }
    },
  })

  return anchor
}
