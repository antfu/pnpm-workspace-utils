import type { PnpmWorkspaceYamlExtended } from './_read'
import { resolve } from 'pathe'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import { expect, it } from 'vitest'
import { getWorkspacePackageJsonPaths, isWorkspacePackageJson } from './workspace'

function createWorkspace(content: string): PnpmWorkspaceYamlExtended {
  const workspace = parsePnpmWorkspaceYaml(content)
  return {
    filepath: 'pnpm-workspace.yaml',
    lastRead: Date.now(),
    ...workspace,
    hasQueue: () => false,
    queueChange: () => {},
  }
}

it('matches package.json files covered by workspace packages patterns and always includes root', () => {
  const workspace = createWorkspace(`
packages:
  - packages/*
`)

  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages/pnpm-workspace-yaml/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('examples/demo/package.json', workspace)).toBe(false)
})

it('respects negated package patterns', () => {
  const workspace = createWorkspace(`
packages:
  - packages/*
  - '!packages/pnpm-workspace-yaml'
`)

  const packageJsonPaths = getWorkspacePackageJsonPaths(workspace)

  expect(packageJsonPaths.size).toBe(2)
  expect(isWorkspacePackageJson('package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages/pnpm-workspace-yaml/package.json', workspace)).toBe(false)
})

it('includes root and subpackages when packages is missing', () => {
  const withoutPackages = createWorkspace(`
catalog:
  foo: ^1.0.0
`)

  expect(isWorkspacePackageJson('package.json', withoutPackages)).toBe(true)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', withoutPackages)).toBe(true)
  expect(isWorkspacePackageJson('packages/pnpm-workspace-yaml/package.json', withoutPackages)).toBe(true)
})

it('falls back to the root package when packages is invalid', () => {
  const withInvalidPackages = createWorkspace(`
packages:
  - packages/*
  - {}
`)

  expect(getWorkspacePackageJsonPaths(withInvalidPackages)).toEqual(new Set([
    resolve('package.json'),
  ]))
  expect(isWorkspacePackageJson('package.json', withInvalidPackages)).toBe(true)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', withInvalidPackages)).toBe(false)
})

it('matches nested patterns and excludes dist, build and node_modules', () => {
  const workspace = createWorkspace(`
packages:
  - packages/**
  - '*/eslint-plugin-pnpm/'
  - '!packages/pnpm-workspace-yaml/**'
`)

  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages/pnpm-workspace-yaml/package.json', workspace)).toBe(false)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/dist/package.json', workspace)).toBe(false)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/build/package.json', workspace)).toBe(false)
  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/node_modules/pathe/package.json', workspace)).toBe(false)
  expect(isWorkspacePackageJson('packages/.hidden/package.json', workspace)).toBe(false)
})

it('matches a path even if the file does not exist yet', () => {
  const workspace = createWorkspace(`
packages:
  - packages/*
`)

  expect(isWorkspacePackageJson('packages/new-package/package.json', workspace)).toBe(true)
})

it('matches absolute and Windows-style paths', () => {
  const workspace = createWorkspace(`
packages:
  - packages/*
`)

  expect(isWorkspacePackageJson(resolve('packages/a/package.json'), workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages\\a\\package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson(resolve('package.json').replaceAll('/', '\\'), workspace)).toBe(true)
  expect(isWorkspacePackageJson(resolve('../outside/package.json'), workspace)).toBe(false)
})

it('ignores double negated patterns like tinyglobby', () => {
  const workspace = createWorkspace(`
packages:
  - packages/*
  - '!!packages/pnpm-workspace-yaml'
`)

  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('packages/pnpm-workspace-yaml/package.json', workspace)).toBe(true)
})

it('matches absolute patterns relative to the workspace root', () => {
  const workspace = createWorkspace(`
packages:
  - ${resolve('packages/*')}
`)

  expect(isWorkspacePackageJson('packages/eslint-plugin-pnpm/package.json', workspace)).toBe(true)
  expect(isWorkspacePackageJson('examples/demo/package.json', workspace)).toBe(false)
})
