import type { PnpmWorkspaceYamlExtended } from './_read'
import { readPnpmWorkspace } from './_read'

const WORKSPACE_CACHE_TIME = 10_000
let workspaceLastRead: number | undefined
let workspace: PnpmWorkspaceYamlExtended | undefined

export function getPnpmWorkspace(): PnpmWorkspaceYamlExtended | undefined {
  if (workspaceLastRead && workspace && !workspace.hasQueue() && Date.now() - workspaceLastRead > WORKSPACE_CACHE_TIME) {
    workspace = undefined
  }
  if (!workspace) {
    workspace = readPnpmWorkspace()
    workspaceLastRead = Date.now()
  }
  return workspace
}
