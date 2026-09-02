import type { AST } from 'yaml-eslint-parser'
import { basename } from 'pathe'
import { createEslintRule } from '../../utils/create'

export const RULE_NAME = 'yaml-blank-lines'
export type MessageIds = 'missingBlankLine' | 'unexpectedBlankLine' | 'extraBlankLines'
export type Options = []

/**
 * A pair is "large" when it spans more than one line, i.e. block mappings and
 * sequences (`catalogs:`, `allowBuilds:`, ...) and multi-line scalars - as
 * opposed to one-liners like `shamefullyHoist: true`.
 */
function isMultiline(pair: AST.YAMLPair): boolean {
  return pair.loc.start.line !== pair.loc.end.line
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Require blank lines around multi-line entries in `pnpm-workspace.yaml`, and disallow them between single-line entries',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      missingBlankLine: 'Expected a blank line before `{{key}}`.',
      unexpectedBlankLine: 'Unexpected blank line before `{{key}}`.',
      extraBlankLines: 'Expected only one blank line before `{{key}}`.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (basename(context.filename) !== 'pnpm-workspace.yaml')
      return {}

    const { sourceCode } = context
    const ast = sourceCode.ast as unknown as AST.YAMLProgram
    const eol = sourceCode.text.includes('\r\n') ? '\r\n' : '\n'

    for (const doc of ast.body) {
      const content = doc.content
      if (content?.type !== 'YAMLMapping' || content.style !== 'block')
        continue

      // Top-level entries only. Nested blocks (catalog groups, `update:`, ...)
      // keep whatever spacing the author gave them.
      const pairs = content.pairs
      for (let i = 1; i < pairs.length; i++) {
        const prev = pairs[i - 1]
        const pair = pairs[i]

        // A comment owns the gap it sits in - the author put it there to group
        // things, so leave the surrounding blank lines alone. A comment trailing
        // on the previous entry's own line is not "in between".
        const hasCommentBetween = ast.comments.some(comment => (
          comment.loc.start.line > prev.loc.end.line
          && comment.loc.end.line < pair.loc.start.line
        ))
        if (hasCommentBetween)
          continue

        const blankLines = pair.loc.start.line - prev.loc.end.line - 1
        const expected = isMultiline(prev) || isMultiline(pair) ? 1 : 0
        if (blankLines === expected)
          continue

        const messageId = expected === 0
          ? 'unexpectedBlankLine'
          : blankLines === 0
            ? 'missingBlankLine'
            : 'extraBlankLines'

        // The gap spans from the line right after `prev` to the line `pair`
        // starts on, so a trailing comment on `prev`'s line stays put.
        const start = sourceCode.getIndexFromLoc({ line: prev.loc.end.line + 1, column: 0 })
        const end = sourceCode.getIndexFromLoc({ line: pair.loc.start.line, column: 0 })

        context.report({
          loc: pair.key?.loc ?? pair.loc,
          messageId,
          data: { key: pair.key ? sourceCode.text.slice(...pair.key.range) : '' },
          fix: fixer => fixer.replaceTextRange([start, end], eol.repeat(expected)),
        })
      }
    }

    return {}
  },
})
