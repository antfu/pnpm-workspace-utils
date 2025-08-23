import type { Alias, Document, Scalar, ToStringOptions, YAMLMap } from 'yaml'
import { isAlias, Pair, parseDocument, visit } from 'yaml'

export interface PnpmWorkspaceYamlSchema {
  packages?: string[]
  overrides?: Record<string, string>
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
}

export interface PnpmWorkspaceYaml {
  getDocument: () => Document.Parsed
  setContent: (content: string) => void
  hasChanged: () => boolean
  toJSON: () => PnpmWorkspaceYamlSchema
  toString: (options?: ToStringOptions) => string
  setPath: (path: string[], value: any) => void
  /**
   * Set a package to catalog
   */
  setPackage: (catalog: 'default' | (string & {}), packageName: string, specifier: string) => void
  /**
   * Set a package to catalog only when the version matches, otherwise create a conflicts catalog
   */
  setPackageNoConflicts: (catalog: 'default' | (string & {}), packageName: string, specifier: string) => void
  /**
   * Get all catalogs for a package
   */
  getPackageCatalogs: (packageName: string) => string[]
  /**
   * Check if the specifier has conflicts with the existing specifier in the catalog
   */
  hasSpecifierConflicts: (catalog: 'default' | (string & {}), packageName: string, specifier: string) => {
    conflicts: boolean
    newCatalogName: string
    existingSpecifier?: string
  }
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

  function hasSpecifierConflicts(catalogName: string, packageName: string, specifier: string): {
    conflicts: boolean
    newCatalogName: string
    existingSpecifier?: string
  } {
    const data = document.toJSON() || {}
    const existingSpecifier = catalogName === 'default'
      ? data.catalog?.[packageName]
      : data.catalogs?.[catalogName]?.[packageName]
    if (existingSpecifier === specifier) {
      return {
        conflicts: false,
        newCatalogName: catalogName,
        existingSpecifier,
      }
    }
    if (existingSpecifier) {
      const versionSuffix = normalizeCatalogName(specifier)
      // For default catalog, we need to create a new named catalog
      const newCatalogName = catalogName === 'default'
        ? `conflicts_${packageName}_${versionSuffix}`
        : `conflicts_${catalogName}_${versionSuffix}`

      return {
        conflicts: true,
        existingSpecifier,
        newCatalogName,
      }
    }
    return {
      conflicts: false,
      newCatalogName: catalogName,
    }
  }

  function setPackageNoConflicts(catalogName: string, packageName: string, specifier: string): void {
    const { newCatalogName } = hasSpecifierConflicts(catalogName, packageName, specifier)
    setPackage(newCatalogName, packageName, specifier)
  }

  function setPackage(catalogName: string, packageName: string, specifier: string): void {
    const useCatalogsDefault = document.toJSON()?.catalogs?.default !== undefined
    // Simply set the package in the specified catalog, overriding any existing value
    if (catalogName === 'default' && !useCatalogsDefault) {
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
    getDocument() {
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
    setPackage,
    setPackageNoConflicts,
    getPackageCatalogs,
    hasSpecifierConflicts,
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

function normalizeCatalogName(name: string): string {
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
  return name
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
}
