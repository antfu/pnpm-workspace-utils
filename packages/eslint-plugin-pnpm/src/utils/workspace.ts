import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { PnpmWorkspaceYamlExtended } from './_read'
import { dirname, join, normalize, resolve } from 'pathe'
import { globSync } from 'tinyglobby'
import { createPnpmWorkspace, findPnpmWorkspace, readPnpmWorkspace } from './_read'

const WORKSPACE_CACHE_TIME = 10_000
const PACKAGE_JSON_GLOB_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
]

const workspaces: Record<string, PnpmWorkspaceYamlExtended | undefined> = {}
const packageJsonPathCache = new Map<string, Set<string>>()

export function getPnpmWorkspace(
  context: RuleContext<any, any>,
): PnpmWorkspaceYamlExtended | undefined {
  const sourcePath = context.filename
  const ensureWorkspaceFile = context.settings.pnpm?.ensureWorkspaceFile

  let workspacePath = findPnpmWorkspace(sourcePath)
  if (!workspacePath) {
    if (ensureWorkspaceFile)
      workspacePath = createPnpmWorkspace(sourcePath)
    else
      throw new Error('pnpm-workspace.yaml not found')
  }
  let workspace = workspaces[workspacePath]
  if (workspace && !workspace.hasQueue() && Date.now() - workspace.lastRead > WORKSPACE_CACHE_TIME) {
    workspaces[workspacePath] = undefined
    workspace = undefined
  }
  if (!workspace) {
    workspace = readPnpmWorkspace(workspacePath)
    workspaces[workspacePath] = workspace
  }
  return workspace
}

export function getWorkspacePackageJsonPaths(workspace: PnpmWorkspaceYamlExtended): Set<string> {
  const packages = workspace.toJSON()?.packages
  const root = resolve(dirname(workspace.filepath))
  const rootPackageJson = normalize(resolve(root, 'package.json'))

  if (packages === undefined) {
    return new Set([
      rootPackageJson,
      ...globPackageJsonPaths(root, ['**/package.json'], PACKAGE_JSON_GLOB_IGNORE),
    ])
  }
  if (!Array.isArray(packages))
    return new Set([rootPackageJson])

  const packageJsonGlobs = getPackageJsonPatterns(packages)
  if (!packageJsonGlobs)
    return new Set([rootPackageJson])

  return new Set([
    rootPackageJson,
    ...globPackageJsonPaths(root, packageJsonGlobs.include, packageJsonGlobs.exclude),
  ])
}

function getPackageJsonPatterns(packages: string[]): { include: string[], exclude: string[] } | undefined {
  const include: string[] = []
  const exclude = [...PACKAGE_JSON_GLOB_IGNORE]

  for (const pattern of packages) {
    if (typeof pattern !== 'string')
      return undefined

    if (pattern.startsWith('!'))
      exclude.push(toPackageJsonGlob(pattern.slice(1)))
    else
      include.push(toPackageJsonGlob(pattern))
  }

  return { include, exclude }
}

function globPackageJsonPaths(
  root: string,
  includeGlobs: string[],
  excludeGlobs: string[],
): Set<string> {
  const cacheKey = JSON.stringify({ root, includeGlobs, excludeGlobs })
  const cached = packageJsonPathCache.get(cacheKey)
  if (cached)
    return cached

  const paths = new Set<string>()
  if (includeGlobs.length === 0) {
    packageJsonPathCache.set(cacheKey, paths)
    return paths
  }

  const packageJsonPaths = globSync(includeGlobs, {
    cwd: root,
    dot: false,
    ignore: excludeGlobs,
    absolute: true,
    expandDirectories: false,
    onlyFiles: true,
  })

  for (const path of packageJsonPaths)
    paths.add(normalize(path))

  packageJsonPathCache.set(cacheKey, paths)
  return paths
}

export function isWorkspacePackageJson(
  filename: string,
  workspace: PnpmWorkspaceYamlExtended,
): boolean {
  if (!filename.endsWith('package.json'))
    return false

  const root = resolve(dirname(workspace.filepath))
  const target = normalize(resolve(root, filename))
  return getWorkspacePackageJsonPaths(workspace).has(target)
}

function toPackageJsonGlob(pattern: string): string {
  return pattern.endsWith('package.json')
    ? pattern
    : join(pattern, 'package.json')
}
