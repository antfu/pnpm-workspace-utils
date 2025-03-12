import { rules as jsonRules } from './json'
import { rules as yamlRules } from './yaml'

export const rules = {
  ...jsonRules,
  ...yamlRules,
}
