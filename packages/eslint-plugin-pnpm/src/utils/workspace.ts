import type { PnpmWorkspaceYamlExtended } from './_read'
import { findPnpmWorkspace, readPnpmWorkspace } from './_read'

const WORKSPACE_CACHE_TIME = 10_000
const workspaces: Record<string, PnpmWorkspaceYamlExtended | undefined> = {}

export function getPnpmWorkspace(
  sourcePath: string,
): PnpmWorkspaceYamlExtended | undefined {
  const workspacePath = findPnpmWorkspace(sourcePath)
  if (!workspacePath)
    throw new Error('pnpm-workspace.yaml not found')
  let workspace = workspaces[workspacePath]
  if (workspace && !workspace.hasQueue() && Date.now() - workspace.lastRead > WORKSPACE_CACHE_TIME) {
    workspaces[workspacePath] = undefined
    workspace = undefined
  }
  if (!workspace) {
    workspace = readPnpmWorkspace(workspacePath)
    workspaces[workspacePath] = workspace
  }
  return workspace
}
