import type { Alias, Document, Scalar, ToStringOptions, YAMLMap } from 'yaml'
import { isAlias, Pair, parseDocument, visit } from 'yaml'

export interface PnpmWorkspaceYamlSchema {
  packages?: string[]
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
}

export interface PnpmWorkspaceYaml {
  document: Document.Parsed
  setContent: (content: string) => void
  hasChanged: () => boolean
  toJSON: () => PnpmWorkspaceYamlSchema
  toString: (options?: ToStringOptions) => string
  setPath: (path: string[], value: any) => void
  setPackage: (catalog: 'default' | (string & {}), packageName: string, specifier: string) => void
  getPackageCatalogs: (packageName: string) => string[]
}

/**
 * Parse pnpm workspace yaml content, and return an object to modify the content
 * while preserving the comments, anchor, and alias.
 */
export function parsePnpmWorkspaceYaml(content: string): PnpmWorkspaceYaml {
  let document = parseDocument(content)
  let hasChanged = false

  function setContent(newContent: string): void {
    content = newContent
    document = parseDocument(content)
    hasChanged = false
  }

  function setPath(path: string[], value: any): void {
    let map = path.length === 1
      ? (document.contents as unknown as YAMLMap<Scalar.Parsed | string, Scalar.Parsed | string>)
      : (document.getIn(path.slice(0, -1)) as YAMLMap<Scalar.Parsed | string, Scalar.Parsed | string>)
    if (!map) {
      map = document.createNode({})
      document.setIn(path.slice(0, -1), map)
    }

    const key = path[path.length - 1]
    let pair = map.items.find(i => typeof i.key === 'string' ? i.key === key : i.key.value === key)
    const keys = map.items.map(i => typeof i.key === 'string' ? i.key : String(i.key.value))
    if (!pair) {
      let index = 0
      // Find the index to insert with sorted
      for (; index < keys.length; index++) {
        if (keys[index].localeCompare(key) > 0) {
          break
        }
      }
      pair = new Pair(key, value) as any
      map.items.splice(index, 0, pair!)
      hasChanged = true
    }
    else {
      if (isAlias(pair.value)) {
        const alias = findAnchor(document, pair.value)
        if (alias) {
          if (alias.value !== value) {
            alias.value = value
            hasChanged = true
          }
        }
      }
      else {
        if (!pair.value || typeof pair.value === 'string') {
          if (pair.value !== value) {
            pair.value = value
            hasChanged = true
          }
        }
        else {
          if (pair.value.value !== value) {
            pair.value.value = value
            hasChanged = true
          }
        }
      }
    }
  }

  function setCatalogPackage(catalogName: string, packageName: string, specifier: string): void {
    if (catalogName === 'default') {
      setPath(['catalog', packageName], specifier)
    }
    else {
      setPath(['catalogs', catalogName, packageName], specifier)
    }
  }

  function getPackageCatalogs(packageName: string): string[] {
    const catalogs: string[] = []
    const data = document.toJSON() || {}
    if (data.catalogs) {
      for (const catalog of Object.keys(data.catalogs)) {
        if (data.catalogs[catalog]?.[packageName]) {
          catalogs.push(catalog)
        }
      }
    }
    if (data.catalog) {
      if (data.catalog[packageName]) {
        catalogs.push('default')
      }
    }
    return catalogs
  }

  return {
    get document() {
      return document
    },
    setContent,
    hasChanged: () => hasChanged,
    toJSON: () => document.toJSON(),
    toString: (options?: ToStringOptions) => {
      // guess quote based on the content
      const singleQuote = content.split('\'').length >= content.split('"').length
      return document.toString({
        singleQuote,
        ...options,
      })
    },
    setPath,
    setPackage: setCatalogPackage,
    getPackageCatalogs,
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
