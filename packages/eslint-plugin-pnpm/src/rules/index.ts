import enforceCatalog from './enforce-catalog'
import preferWorkspaceSettings from './prefer-workspace-settings'
import validCatalog from './valid-catalog'

export const rules = {
  'enforce-catalog': enforceCatalog,
  'valid-catalog': validCatalog,
  'prefer-workspace-settings': preferWorkspaceSettings,
}
