import { basename, normalize } from 'pathe'
import { isMap, isScalar } from 'yaml'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-no-anonymous-catalog'
export type MessageIds = 'unexpectedAnonymousCatalog'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the anonymous `catalog:` in `pnpm-workspace.yaml` in favor of named catalogs',
    },
    schema: [],
    messages: {
      unexpectedAnonymousCatalog: 'Avoid the anonymous `catalog:`. Use a named catalog (`catalogs: <name>:`) instead.',
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

    const contents = workspace.getDocument().contents
    if (!isMap(contents))
      return {}

    // Report on the key node so the error points at `catalog:` rather than the
    // whole block. An empty `catalog:` is still flagged - it's the wrong syntax.
    const key = contents.items.find(item => isScalar(item.key) && item.key.value === 'catalog')?.key
    if (!isScalar(key) || !key.range)
      return {}

    context.report({
      loc: {
        start: context.sourceCode.getLocFromIndex(key.range[0]),
        end: context.sourceCode.getLocFromIndex(key.range[1]),
      },
      messageId: 'unexpectedAnonymousCatalog',
    })

    return {}
  },
})
