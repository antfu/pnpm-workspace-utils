import type { PnpmWorkspaceYamlWithWrite } from './read'
import { readPnpmWorkspace } from './read'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: (() => void)[] = []

let doc: PnpmWorkspaceYamlWithWrite | undefined

export function getPnpmWorkspace(): PnpmWorkspaceYamlWithWrite | undefined {
  doc ||= readPnpmWorkspace()
  return doc
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
    if (doc?.hasChanged()) {
      doc.write()
      doc = undefined
    }
  }, 0)
}
