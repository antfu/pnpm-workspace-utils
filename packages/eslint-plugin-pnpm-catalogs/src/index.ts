import type { ESLint } from 'eslint'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
  rules,
}

export default plugin
