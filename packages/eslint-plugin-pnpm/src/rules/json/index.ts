import enforceCatalog from './json-enforce-catalog'
import preferWorkspaceSettings from './json-prefer-workspace-settings'
import validCatalog from './json-valid-catalog'

export const rules = {
  'json-enforce-catalog': enforceCatalog,
  'json-valid-catalog': validCatalog,
  'json-prefer-workspace-settings': preferWorkspaceSettings,
}
