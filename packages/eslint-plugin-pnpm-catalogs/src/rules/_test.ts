import type { RuleTesterInitOptions, TestCasesOptions } from 'eslint-vitest-rule-tester'
import { run as _run } from 'eslint-vitest-rule-tester'
import jsoncParser from 'jsonc-eslint-parser'

export function run(options: TestCasesOptions & RuleTesterInitOptions): void {
  _run({
    parser: jsoncParser as any,
    ...options,
  })
}
