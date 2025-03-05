import type { PnpmWorkspaceYaml } from 'pnpm-catalogs-utils'
import fs from 'node:fs'
import { findUpSync } from 'find-up-simple'
import { parsePnpmWorkspaceYaml } from 'pnpm-catalogs-utils'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: Record<string, ((doc: PnpmWorkspaceYaml) => void)[]> = {}

export function addToQueue(filename: string, fn: (doc: PnpmWorkspaceYaml) => void): void {
  const pwPath = findUpSync('pnpm-workspace.yaml', { cwd: filename })
  if (!pwPath)
    return
  queue[pwPath] ??= []
  queue[pwPath].push(fn)
  clearTimeout(queueTimer)
  queueTimer = setTimeout(() => {
    const clone = { ...queue }
    Object.entries(clone).forEach(([pwPath, fns]) => {
      const doc = parsePnpmWorkspaceYaml(fs.readFileSync(pwPath, 'utf-8'))
      for (const fn of fns)
        fn(doc)
      if (doc.hasChanged())
        fs.writeFileSync(pwPath, doc.toString(), 'utf-8')
    })
    queue = {}
    queueTimer = undefined
  }, 0)
}
