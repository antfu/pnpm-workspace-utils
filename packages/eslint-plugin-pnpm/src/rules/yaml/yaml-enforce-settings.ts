import type { YAMLMap, Scalar as YAMLScalar } from 'yaml'
import { isDeepEqual } from '@antfu/utils'
import { basename, normalize } from 'pathe'
import yaml from 'yaml'
import { createEslintRule } from '../../utils/create'
import { getPnpmWorkspace } from '../../utils/workspace'

export const RULE_NAME = 'yaml-enforce-settings'
export type MessageIds = 'requiredFieldsMissing' | 'settingMismatch' | 'settingMissing' | 'forbiddenFieldFound'
export type Options = [
  {
    autofix?: boolean
    settings?: Record<string, any>
    requiredFields?: string[]
    forbiddenFields?: string[]
  },
]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Enforce settings in `pnpm-workspace.yaml`',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          autofix: {
            type: 'boolean',
            description: 'Whether to autofix the linting error',
            default: true,
          },
          settings: {
            description: 'Exact settings to enforce, for both keys and values. Auto-fixable.',
            type: 'object',
          },
          requiredFields: {
            description: 'Required settings fields to enforce, regardless of their values. Not-autofixable.',
            type: 'array',
            items: {
              type: 'string',
            },
          },
          forbiddenFields: {
            description: 'Forbidden settings fields to enforce, regardless of their values. Not-autofixable.',
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    ],
    messages: {
      requiredFieldsMissing: 'Required settings fields {{keys}} are missing in `pnpm-workspace.yaml`.',
      settingMissing: 'Setting "{{key}}" is missing in `pnpm-workspace.yaml`.',
      settingMismatch: 'Setting "{{key}}" has mismatch value. Expected: {{expected}}, Actual: {{actual}}.',
      forbiddenFieldFound: 'Forbidden setting field "{{key}}" is found in `pnpm-workspace.yaml`.',
    },
  },
  defaultOptions: [
    {
      autofix: true,
      settings: {},
      requiredFields: [],
      forbiddenFields: [],
    },
  ],
  create(context, [options = {}]) {
    const {
      autofix = true,
      settings = {},
      requiredFields = [],
      forbiddenFields = [],
    } = options || {}

    if (Object.keys(settings).length === 0 && requiredFields.length === 0 && forbiddenFields.length === 0)
      throw new Error('Either `settings` or `requiredFields` or `forbiddenFields` must be provided, this rule is not functional currently.')

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

    const missingFields: string[] = []
    for (const key of requiredFields) {
      if (!Object.hasOwn(parsed, key)) {
        missingFields.push(key)
      }
    }
    if (missingFields.length > 0) {
      context.report({
        loc: {
          start: context.sourceCode.getLocFromIndex(0),
          end: context.sourceCode.getLocFromIndex(0),
        },
        messageId: 'requiredFieldsMissing',
        data: { keys: missingFields.map(i => JSON.stringify(i)).join(', ') },
      })
    }

    for (const key of forbiddenFields) {
      const node = doc.getIn([key], true) as YAMLScalar | YAMLMap | undefined
      if (!node)
        continue
      context.report({
        loc: {
          start: context.sourceCode.getLocFromIndex(node?.range?.[0] ?? 0),
          end: context.sourceCode.getLocFromIndex(node?.range?.[1] ?? 0),
        },
        messageId: 'forbiddenFieldFound',
        data: { key },
      })
    }

    for (const [key, value] of Object.entries(settings)) {
      if (isDeepEqual(parsed[key], value))
        continue

      const node = doc.getIn([key], true) as YAMLScalar | YAMLMap | undefined
      const actualValue = parsed[key]
      const expectedStr = JSON.stringify(value)
      const actualStr = actualValue !== undefined ? JSON.stringify(actualValue) : 'undefined'

      if (!node) {
        if (parsed[key] != null) {
          throw new Error('Node should not be undefined')
        }

        // Node doesn't exist or has no range - insert at start of the file
        context.report({
          loc: {
            start: context.sourceCode.getLocFromIndex(0),
            end: context.sourceCode.getLocFromIndex(0),
          },
          messageId: 'settingMismatch',
          data: { key, expected: expectedStr, actual: actualStr },
          fix: autofix
            ? (fixer) => {
                const replacer = `\n${yaml.stringify({ [key]: value }, { collectionStyle: 'block' })}`
                return fixer.insertTextBeforeRange([0, 0], replacer)
              }
            : undefined,
        })
      }
      else {
        if (!node.range)
          throw new Error('Node range is not found')
        // Node exists with range - replace the value
        // Get the parent map to find the key-value pair
        const mapNode = doc.contents as unknown as YAMLMap | undefined
        let pairItem: { key: YAMLScalar, value: any } | undefined
        if (mapNode?.items) {
          for (const item of mapNode.items) {
            if (item.key && typeof item.key === 'object' && 'value' in item.key && item.key.value === key) {
              pairItem = item as any
              break
            }
          }
        }

        let startIndex = node.range[0]
        let endIndex = node.range[1]

        // If we found the pair item, try to get the full key-value range
        if (pairItem?.key?.range && pairItem?.value?.range) {
          // Get from start of key to end of value
          startIndex = pairItem.key.range[0]
          endIndex = pairItem.value.range[1]
        }

        context.report({
          loc: {
            start: context.sourceCode.getLocFromIndex(startIndex),
            end: context.sourceCode.getLocFromIndex(endIndex),
          },
          messageId: 'settingMismatch',
          data: { key, expected: expectedStr, actual: actualStr },
          fix: autofix
            ? (fixer) => {
                const replacer = `\n${yaml.stringify({ [key]: value }, { collectionStyle: 'block' })}`
                return fixer.replaceTextRange([startIndex, endIndex], replacer)
              }
            : undefined,
        })
      }
    }

    return {}
  },
})
