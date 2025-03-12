import type { RuleTesterInitOptions, TestCasesOptions } from 'eslint-vitest-rule-tester'
import type { PnpmWorkspaceYamlExtended } from './_read'
import { beforeEach } from 'node:test'
import { run as _run } from 'eslint-vitest-rule-tester'
import jsoncParser from 'jsonc-eslint-parser'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import { vi } from 'vitest'
import yamlParser from 'yaml-eslint-parser'
// @ts-expect-error mocked function
import { _getWorkspace, _reset } from './_read'

vi.mock('../utils/_read', () => {
  let workspace = parsePnpmWorkspaceYaml('')
  return {
    findPnpmWorkspace: () => 'pnpm-workspace.yaml',
    readPnpmWorkspace: (): PnpmWorkspaceYamlExtended => {
      return {
        lastRead: Date.now(),
        filepath: 'pnpm-workspace.yaml',
        ...workspace,
        hasQueue: () => false,
        queueChange: (fn) => {
          fn(workspace)
        },
      }
    },
    _getWorkspace: () => workspace,
    _reset() {
      workspace = parsePnpmWorkspaceYaml('')
    },
  }
})

beforeEach(() => {
  _reset()
})

export function getMockedWorkspace(): PnpmWorkspaceYamlExtended {
  return _getWorkspace()
}

export function runJson(options: TestCasesOptions & RuleTesterInitOptions): void {
  _run({
    parser: jsoncParser as any,
    ...options,
  })
}

export function runYaml(options: TestCasesOptions & RuleTesterInitOptions): void {
  _run({
    parser: yamlParser as any,
    ...options,
  })
}
