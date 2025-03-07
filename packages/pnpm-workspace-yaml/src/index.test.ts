import { describe, expect, it } from 'vitest'
import { parsePnpmWorkspaceYaml } from '.'

it('should update the catalog package', () => {
  const input = `
catalog:
  '@unocss/core': ^0.66.0
  react: ^18.2.0

catalogs:
  # Don't use React
  react18:
    next: ^13.0.0
    react-dom: ^18.2.0
    react: ^18.2.0
  # Not even React 19
  react19:
    react: ^19.0.0
`

  const pw = parsePnpmWorkspaceYaml(input)
  pw.setPackage('react18', '@vue/compiler-sfc', '^3.0.0')
  pw.setPackage('react18', 'vue', '^3.0.0')
  pw.setPackage('react18', 'nuxt', '^3.0.0')
  pw.setPackage('react18', 'angular', '~16.0.0')
  pw.setPackage('react18', 'react', '^18.3.0')
  pw.setPackage('react19', 'react', '^19.1.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      '@unocss/core': ^0.66.0
      react: ^18.2.0

    catalogs:
      # Don't use React
      react18:
        '@vue/compiler-sfc': ^3.0.0
        angular: ~16.0.0
        next: ^13.0.0
        nuxt: ^3.0.0
        react-dom: ^18.2.0
        react: ^18.3.0
        vue: ^3.0.0
      # Not even React 19
      react19:
        react: ^19.1.0
    "
  `)

  expect(pw.getPackageCatalogs('react'))
    .toEqual(['react18', 'react19', 'default'])
})

it('should create when empty', () => {
  const input = ''
  const pw = parsePnpmWorkspaceYaml(input)
  pw.setPackage('default', 'react', '^18.2.0')
  pw.setPackage('vue', 'vue', '^3.0.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      react: ^18.2.0
    catalogs:
      vue:
        vue: ^3.0.0
    "
  `)
})

it('should work with anchor & alias', () => {
  const yaml = `
  catalog:
    react: &foo ^18.2.0
    react-dom: *foo
`.trim()

  const pw = parsePnpmWorkspaceYaml(yaml)
  pw.setPackage('default', 'react-dom', '^18.3.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      react: &foo ^18.3.0
      react-dom: *foo
    "
  `)

  pw.setPackage('default', 'react', '^18.2.0')
  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      react: &foo ^18.2.0
      react-dom: *foo
    "
  `)
})

it('should work with define', () => {
  const yaml = `
defines:
  - &react ^18.2.0

catalog:
  react: *react
  react-dom: *react
`.trim()

  const pw = parsePnpmWorkspaceYaml(yaml)
  pw.setPackage('default', 'react-dom', '^18.3.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "defines:
      - &react ^18.3.0

    catalog:
      react: *react
      react-dom: *react
    "
  `)

  pw.setContent('')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "null
    "
  `)

  pw.setContent(`
catalog:
  '@unocss/core': ^66.0.0
`)

  pw.setPackage('default', '@unocss/vite', '^66.0.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      '@unocss/core': ^66.0.0
      '@unocss/vite': ^66.0.0
    "
  `)
})

describe('preserve formatting', () => {
  it('preseve quotes', () => {
    const yaml1 = `
catalog:
  '@unocss/core': ^66.0.0
`
    const yaml2 = ` 
catalog:
  "@unocss/core": ^66.0.0
`
    const pw1 = parsePnpmWorkspaceYaml(yaml1)
    const pw2 = parsePnpmWorkspaceYaml(yaml2)
    pw1.setPackage('default', '@unocss/vite', '^66.0.0')
    pw2.setPackage('default', '@unocss/vite', '^66.0.0')

    expect(pw1.toString()).toMatchInlineSnapshot(`
      "catalog:
        '@unocss/core': ^66.0.0
        '@unocss/vite': ^66.0.0
      "
    `)
    expect(pw2.toString()).toMatchInlineSnapshot(`
      "catalog:
        "@unocss/core": ^66.0.0
        "@unocss/vite": ^66.0.0
      "
    `)
  })
})
