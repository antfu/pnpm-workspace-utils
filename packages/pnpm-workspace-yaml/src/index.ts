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
    // Check if the package already exists in any catalog
    const data = document.toJSON() || {}
    const existingSpecifier = catalogName === 'default'
      ? data.catalog?.[packageName]
      : data.catalogs?.[catalogName]?.[packageName]

    // If the package exists with the same version, do nothing
    if (existingSpecifier === specifier) {
      return
    }

    // If the package exists with a different version, create a new version-specific catalog
    if (existingSpecifier) {
      // Convert version specifier to a valid suffix for the catalog name
      // Replace special characters:
      // ^ -> h (hat)
      // ~ -> t (tilde)
      // . -> _ (underscore)
      // < -> l (less than)
      // > -> g (greater than)
      // = -> e (equals)
      // * -> s (star)
      // @ -> a (at)
      // | -> p (pipe)
      // & -> n (and)
      // - -> m (minus)
      // + -> u (plus)
      // space -> _ (underscore)
      const versionSuffix = specifier
        .replace(/\^/g, 'h')
        .replace(/~/g, 't')
        .replace(/\./g, '_')
        .replace(/</g, 'l')
        .replace(/>/g, 'g')
        .replace(/=/g, 'e')
        .replace(/\*/g, 's')
        .replace(/@/g, 'a')
        .replace(/\|/g, 'p')
        .replace(/&/g, 'n')
        .replace(/-/g, 'm')
        .replace(/\+/g, 'u')
        .replace(/\s/g, '_')

      // For default catalog, we need to create a new named catalog
      if (catalogName === 'default') {
        // Create a new catalog name based on the package and version
        const newCatalogName = `${packageName}_${versionSuffix}`

        // Check if this catalog already exists
        if (data.catalogs?.[newCatalogName]) {
          // If it exists, just add the package to it
          setPath(['catalogs', newCatalogName, packageName], specifier)
        }
        else {
          // Otherwise, create a new version-specific catalog
          setPath(['catalogs', newCatalogName, packageName], specifier)
        }
      }
      else {
        // For named catalogs, create a version-specific catalog
        const newCatalogName = `${catalogName}_${versionSuffix}`

        // Check if this catalog already exists
        if (data.catalogs?.[newCatalogName]) {
          // If it exists, just add the package to it
          setPath(['catalogs', newCatalogName, packageName], specifier)
        }
        else {
          // Otherwise, create a new version-specific catalog
          setPath(['catalogs', newCatalogName, packageName], specifier)
        }
      }
    }
    else {
      // If the package doesn't exist in this catalog, add it normally
      if (catalogName === 'default') {
        setPath(['catalog', packageName], specifier)
      }
      else {
        setPath(['catalogs', catalogName, packageName], specifier)
      }
    }
  }

  function getPackageCatalogs(packageName: string): string[] {
    const catalogs: string[] = []
    const data = document.toJSON() || {}
    if (data.catalogs) {
      for (const catalog of Object.keys(data.catalogs)) {
        if (data.catalogs[catalog]?.[packageName]) {
          // Filter out version-specific catalogs (those with underscores)
          if (!catalog.includes('_')) {
            catalogs.push(catalog)
          }
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
