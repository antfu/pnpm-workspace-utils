import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { AST } from 'jsonc-eslint-parser'

export function getPackageJsonRootNode(context: RuleContext<any, any>): AST.JSONObjectExpression | undefined {
  if (!context.filename.endsWith('package.json'))
    return

  const ast = context.sourceCode.ast
  const root = ast.body[0] as unknown as AST.JSONExpressionStatement

  if (root.expression.type === 'JSONObjectExpression')
    return root.expression
}

export function* iterateDependencies(
  context: RuleContext<any, any>,
  fields: string[],
): Generator<
    {
      packageName: string
      specifier: string
      property: AST.JSONProperty
    },
    void,
    unknown
  > {
  const root = getPackageJsonRootNode(context)
  if (!root)
    return

  for (const fieldName of fields) {
    const path = fieldName.split('.')

    let node: AST.JSONObjectExpression | undefined = root
    for (let i = 0; i < path.length; i++) {
      const item = node.properties.find(property => property.key.type === 'JSONLiteral' && property.key.value === path[i])
      if (!item?.value || item.value.type !== 'JSONObjectExpression') {
        node = undefined
        break
      }
      node = item.value as AST.JSONObjectExpression
    }
    if (!node || node === root)
      continue

    for (const property of node.properties) {
      if (property.value.type !== 'JSONLiteral' || property.key.type !== 'JSONLiteral')
        continue
      if (typeof property.value.value !== 'string')
        continue

      const packageName = String(property.key.value)
      const specifier = String(property.value.value)

      yield {
        packageName,
        specifier,
        property,
      }
    }
  }
}
