import noDuplicateCatalogItem from './yaml-no-duplicate-catalog-item'
import noUnusedCatalogItem from './yaml-no-unused-catalog-item'
import validPackages from './yaml-valid-packages'

export const rules = {
  'yaml-no-unused-catalog-item': noUnusedCatalogItem,
  'yaml-no-duplicate-catalog-item': noDuplicateCatalogItem,
  'yaml-valid-packages': validPackages,
}
