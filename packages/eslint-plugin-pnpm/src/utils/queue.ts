import type { PnpmWorkspaceYamlWithWrite } from './read'
import { readPnpmWorkspace } from './read'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: (() => void)[] = []

const DOC_CACHE_TIME = 10_000
let docLastTime: number | undefined
let doc: PnpmWorkspaceYamlWithWrite | undefined

export function getPnpmWorkspace(): PnpmWorkspaceYamlWithWrite | undefined {
  if (docLastTime && !queueTimer && Date.now() - docLastTime > DOC_CACHE_TIME) {
    doc = undefined
  }
  if (!doc) {
    doc = readPnpmWorkspace()
    docLastTime = Date.now()
  }
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
