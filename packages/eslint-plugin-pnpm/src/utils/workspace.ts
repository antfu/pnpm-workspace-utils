import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { PnpmWorkspaceYamlExtended } from './_read'
import { createPnpmWorkspace, findPnpmWorkspace, readPnpmWorkspace } from './_read'

const WORKSPACE_CACHE_TIME = 10_000
const workspaces: Record<string, PnpmWorkspaceYamlExtended | undefined> = {}

export function getPnpmWorkspace(
  context: RuleContext<any, any>,
): PnpmWorkspaceYamlExtended | undefined {
  const sourcePath = context.filename
  const ensureWorkspaceFile = context.settings.pnpm?.ensureWorkspaceFile

  let workspacePath = findPnpmWorkspace(sourcePath)
  if (!workspacePath) {
    if (ensureWorkspaceFile)
      workspacePath = createPnpmWorkspace(sourcePath)
    else
      throw new Error('pnpm-workspace.yaml not found')
  }
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
