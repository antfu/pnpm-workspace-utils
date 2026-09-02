import blankLines from './yaml-blank-lines'
import enforceSettings from './yaml-enforce-settings'
import noAnonymousCatalog from './yaml-no-anonymous-catalog'
import noDuplicateCatalogItem from './yaml-no-duplicate-catalog-item'
import noUnusedCatalogItem from './yaml-no-unused-catalog-item'
import validPackages from './yaml-valid-packages'

export const rules = {
  'yaml-no-unused-catalog-item': noUnusedCatalogItem,
  'yaml-no-duplicate-catalog-item': noDuplicateCatalogItem,
  'yaml-no-anonymous-catalog': noAnonymousCatalog,
  'yaml-valid-packages': validPackages,
  'yaml-enforce-settings': enforceSettings,
  'yaml-blank-lines': blankLines,
}
