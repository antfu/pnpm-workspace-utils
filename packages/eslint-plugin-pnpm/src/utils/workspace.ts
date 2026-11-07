import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { PnpmWorkspaceYamlExtended } from './_read'
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'pathe'
import picomatch from 'picomatch'
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
  const root = resolve(dirname(workspace.filepath))
  const rootPackageJson = normalize(resolve(root, 'package.json'))
  const globs = getWorkspacePackageJsonGlobs(workspace)
  if (!globs)
    return new Set([rootPackageJson])

  return new Set([
    rootPackageJson,
    ...globPackageJsonPaths(root, globs.include, globs.exclude),
  ])
}

function getWorkspacePackageJsonGlobs(workspace: PnpmWorkspaceYamlExtended): { include: string[], exclude: string[] } | undefined {
  const packages = workspace.toJSON()?.packages
  if (packages === undefined)
    return { include: ['**/package.json'], exclude: PACKAGE_JSON_GLOB_IGNORE }
  if (!Array.isArray(packages))
    return undefined
  return getPackageJsonPatterns(packages)
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
  const target = relative(root, normalize(resolve(root, filename)))
  if (target === 'package.json')
    return true

  const globs = getWorkspacePackageJsonGlobs(workspace)
  if (!globs || globs.include.length === 0)
    return false

  const options = { dot: false, posix: true }
  const exclude = globs.exclude.filter(pattern => pattern[0] !== '!' || pattern[1] === '(')
  return picomatch(globs.include.map(pattern => normalizeGlob(root, pattern)), options)(target)
    && !picomatch(exclude.map(pattern => normalizeGlob(root, pattern)), options)(target)
}

function normalizeGlob(root: string, pattern: string): string {
  const glob = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern
  return isAbsolute(glob) ? relative(root, glob) : normalize(glob)
}

function toPackageJsonGlob(pattern: string): string {
  return pattern.endsWith('package.json')
    ? pattern
    : join(pattern, 'package.json')
}
