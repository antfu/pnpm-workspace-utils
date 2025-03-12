// @ts-check
import antfu from '@antfu/eslint-config'
import { configs } from './packages/eslint-plugin-pnpm/src/index'

export default antfu(
  {
    type: 'lib',
    formatters: true,
  },
  ...configs.recommended,
  ...configs.yaml,
)
