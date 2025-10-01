import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { Scalar as YAMLScalar, YAMLSeq } from 'yaml'
import { basename, dirname, join, normalize, resolve } from 'pathe'
import { globSync } from 'tinyglobby'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-valid-packages'
export type MessageIds = 'noMatch' | 'invalidType'
export type Options = []

function reportError(
  context: RuleContext<MessageIds, Options>,
  item: YAMLScalar,
  messageId: MessageIds,
  data: Record<string, string>,
): void {
  const start = context.sourceCode.getLocFromIndex(item.range![0])
  const end = context.sourceCode.getLocFromIndex(item.range![1])
  context.report({
    loc: { start, end },
    messageId,
    data,
  })
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure all package patterns in `pnpm-workspace.yaml` match at least one directory',
    },
    schema: [],
    messages: {
      noMatch: 'Package pattern "{{pattern}}" does not match any directories with a package.json file.',
      invalidType: 'Package pattern must be a string, got {{type}}.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const workspace = getPnpmWorkspace(context)
    if (!workspace || normalize(workspace.filepath) !== normalize(context.filename))
      return {}

    if (workspace.hasChanged() || workspace.hasQueue())
      return {}

    workspace.setContent(context.sourceCode.text)
    const parsed = workspace.toJSON() || {}

    if (!parsed.packages || !Array.isArray(parsed.packages))
      return {}

    const doc = workspace.getDocument()
    const packagesNode = doc.getIn(['packages']) as YAMLSeq | undefined

    if (!packagesNode)
      return {}

    const root = resolve(dirname(context.filename))

    for (let i = 0; i < parsed.packages.length; i++) {
      const item = packagesNode.items[i] as YAMLScalar | undefined
      if (!item?.range)
        continue

      const pattern = parsed.packages[i]
      if (typeof pattern !== 'string') {
        reportError(context, item, 'invalidType', { type: typeof pattern })
        continue
      }

      const globMatches = globSync(join(pattern, 'package.json'), {
        cwd: root,
        dot: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        absolute: false,
        expandDirectories: false,
        onlyFiles: true,
      }).length

      if (globMatches === 0) {
        reportError(context, item, 'noMatch', { pattern })
      }
    }

    return {}
  },
})
