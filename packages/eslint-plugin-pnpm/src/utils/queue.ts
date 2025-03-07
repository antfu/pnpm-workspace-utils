import type { PnpmWorkspaceYamlWithWrite } from './read'
import { readPnpmWorkspace } from './read'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: (() => void)[] = []

const DOC_CACHE_TIME = 10_000
let workspaceLastRead: number | undefined
let workspace: PnpmWorkspaceYamlWithWrite | undefined

export function getPnpmWorkspace(): PnpmWorkspaceYamlWithWrite | undefined {
  if (workspaceLastRead && !queueTimer && Date.now() - workspaceLastRead > DOC_CACHE_TIME) {
    workspace = undefined
  }
  if (!workspace) {
    workspace = readPnpmWorkspace()
    workspaceLastRead = Date.now()
  }
  return workspace
}

export function addToQueue(fn: () => void, order: 'pre' | 'post' = 'post'): void {
  if (order === 'pre') {
    queue.unshift(fn)
  }
  else {
    queue.push(fn)
  }
  clearTimeout(queueTimer)
  queueTimer = setTimeout(() => {
    queueTimer = undefined
    const clone = [...queue]
    queue = []
    getPnpmWorkspace()
    for (const fn of clone)
      fn()
    if (workspace?.hasChanged()) {
      workspace.write()
      workspace = undefined
    }
  }, 0)
}
