import type { PnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import fs from 'node:fs'
import process from 'node:process'
import { findUpSync } from 'find-up-simple'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'

export interface PnpmWorkspaceYamlWithWrite extends PnpmWorkspaceYaml {
  write: () => void
}

export function readPnpmWorkspace(): PnpmWorkspaceYamlWithWrite | undefined {
  const pwPath = findUpSync('pnpm-workspace.yaml', { cwd: process.cwd() })
  if (!pwPath)
    throw new Error('pnpm-workspace.yaml not found')
  const content = fs.readFileSync(pwPath, 'utf-8')
  const doc = parsePnpmWorkspaceYaml(content)
  return {
    ...doc,
    write: () => {
      fs.writeFileSync(pwPath, doc.toString())
    },
  }
}
