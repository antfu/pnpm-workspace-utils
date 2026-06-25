import type { YAMLMap, Scalar as YAMLScalar } from 'yaml'
import { basename, normalize } from 'pathe'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-require-minimum-release-age'
export type MessageIds = 'missing' | 'invalid'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require `minimumReleaseAge` to be set in `pnpm-workspace.yaml`',
    },
    schema: [],
    messages: {
      missing: '`minimumReleaseAge` is not set in `pnpm-workspace.yaml`. Consider setting it to reduce the risk of installing compromised packages.',
      invalid: '`minimumReleaseAge` in `pnpm-workspace.yaml` must be a positive number, got {{value}}.',
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
    const parsed: any = workspace.toJSON() || {}
    const doc = workspace.getDocument()

    if (!Object.hasOwn(parsed, 'minimumReleaseAge')) {
      context.report({
        loc: {
          start: context.sourceCode.getLocFromIndex(0),
          end: context.sourceCode.getLocFromIndex(0),
        },
        messageId: 'missing',
      })
      return {}
    }

    const value = parsed.minimumReleaseAge
    if (typeof value !== 'number' || value <= 0) {
      const node = doc.getIn(['minimumReleaseAge'], true) as YAMLScalar | YAMLMap | undefined
      const start = node?.range?.[0] ?? 0
      const end = node?.range?.[1] ?? 0
      context.report({
        loc: {
          start: context.sourceCode.getLocFromIndex(start),
          end: context.sourceCode.getLocFromIndex(end),
        },
        messageId: 'invalid',
        data: { value: JSON.stringify(value) },
      })
    }

    return {}
  },
})
