import type { PnpmWorkspaceYamlWithWrite } from './_doc'
import { readDoc } from './_doc'

let queueTimer: ReturnType<typeof setTimeout> | undefined
let queue: (() => void)[] = []

let doc: PnpmWorkspaceYamlWithWrite | undefined

export function getDoc(): PnpmWorkspaceYamlWithWrite | undefined {
  doc ||= readDoc()
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
    getDoc()
    for (const fn of clone)
      fn()
    if (doc?.hasChanged()) {
      doc.write()
      doc = undefined
    }
  }, 0)
}
