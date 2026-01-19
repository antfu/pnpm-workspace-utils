import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: {
    include: ['packages/*'],
  },
  entry: ['src/index.ts'],
  tsconfig: './tsconfig.build.json',
  dts: {
    tsgo: true,
  },
  exports: {
    devExports: 'dev',
  },
  inlineOnly: ['@antfu/utils'],
})
