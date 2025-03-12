import type { PnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import fs from 'node:fs'
import { findUpSync } from 'find-up-simple'
import { dirname } from 'pathe'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'

export interface PnpmWorkspaceYamlExtended extends PnpmWorkspaceYaml {
  filepath: string
  lastRead: number
  hasQueue: () => boolean
  queueChange: (fn: (doc: PnpmWorkspaceYaml) => void, order?: 'pre' | 'post') => void
}

export function findPnpmWorkspace(sourceFile: string): string | undefined {
  return findUpSync('pnpm-workspace.yaml', {
    cwd: dirname(sourceFile),
  })
}

export function readPnpmWorkspace(
  filepath: string,
): PnpmWorkspaceYamlExtended | undefined {
  const content = fs.readFileSync(filepath, 'utf-8')
  const workspace = parsePnpmWorkspaceYaml(content)

  let queueTimer: ReturnType<typeof setTimeout> | undefined
  const queue: ((workspace: PnpmWorkspaceYaml) => void)[] = []

  const write = (): void => {
    fs.writeFileSync(filepath, workspace.toString())
  }
  const hasQueue = (): boolean => queueTimer != null
  const queueChange = (fn: (doc: PnpmWorkspaceYaml) => void, order?: 'pre' | 'post'): void => {
    if (order === 'pre')
      queue.unshift(fn)
    else
      queue.push(fn)

    if (queueTimer != null)
      clearTimeout(queueTimer)
    queueTimer = setTimeout(() => {
      queueTimer = undefined
      const clone = [...queue]
      queue.length = 0
      for (const fn of clone)
        fn(workspace)
      if (workspace.hasChanged())
        write()
    }, 1000)
  }

  return {
    filepath,
    lastRead: Date.now(),
    ...workspace,
    hasQueue,
    queueChange,
  }
}
