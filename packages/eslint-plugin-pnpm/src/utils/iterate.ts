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

export function* iterateDependencies(context: RuleContext<any, any>): Generator<
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

  for (const type of ['dependencies', 'devDependencies']) {
    const node = root.properties.find(property => property.key.type === 'JSONLiteral' && property.key.value === type)
    if (!node)
      continue
    if (node.value.type !== 'JSONObjectExpression')
      continue

    for (const property of node.value.properties) {
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
