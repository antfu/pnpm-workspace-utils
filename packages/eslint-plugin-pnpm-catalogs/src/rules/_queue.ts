import type { PnpmWorkspaceYaml } from 'pnpm-catalogs-utils'
import fs from 'node:fs'
import process from 'node:process'
import { findUpSync } from 'find-up-simple'
import { parsePnpmWorkspaceYaml } from 'pnpm-catalogs-utils'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: (() => void)[] = []

let doc: PnpmWorkspaceYaml | undefined

export function getDoc(): PnpmWorkspaceYaml | undefined {
  if (doc)
    return doc
  const pwPath = findUpSync('pnpm-workspace.yaml', { cwd: process.cwd() })
  if (!pwPath)
    throw new Error('pnpm-workspace.yaml not found')
  const content = fs.readFileSync(pwPath, 'utf-8')
  doc = parsePnpmWorkspaceYaml(content)
  return doc
}

export function addToQueue(fn: () => void): void {
  const pwPath = findUpSync('pnpm-workspace.yaml', { cwd: process.cwd() })
  if (!pwPath)
    return
  queue.push(fn)
  clearTimeout(queueTimer)
  queueTimer = setTimeout(() => {
    queueTimer = undefined
    const clone = [...queue]
    queue = []
    getDoc()
    for (const fn of clone)
      fn()
    if (doc?.hasChanged()) {
      fs.writeFileSync(pwPath, doc.toString(), 'utf-8')
      doc = undefined
    }
  }, 0)
}
