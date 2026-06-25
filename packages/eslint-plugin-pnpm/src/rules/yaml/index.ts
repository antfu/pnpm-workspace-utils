import enforceSettings from './yaml-enforce-settings'
import noDuplicateCatalogItem from './yaml-no-duplicate-catalog-item'
import noUnusedCatalogItem from './yaml-no-unused-catalog-item'
import requireMinimumReleaseAge from './yaml-require-minimum-release-age'
import validPackages from './yaml-valid-packages'

export const rules = {
  'yaml-no-unused-catalog-item': noUnusedCatalogItem,
  'yaml-no-duplicate-catalog-item': noDuplicateCatalogItem,
  'yaml-valid-packages': validPackages,
  'yaml-enforce-settings': enforceSettings,
  'yaml-require-minimum-release-age': requireMinimumReleaseAge,
}
