import { expect, it } from 'vitest'
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
  pw.setCatalogPackage('react18', '@vue/compiler-sfc', '^3.0.0')
  pw.setCatalogPackage('react18', 'vue', '^3.0.0')
  pw.setCatalogPackage('react18', 'nuxt', '^3.0.0')
  pw.setCatalogPackage('react18', 'angular', '~16.0.0')
  pw.setCatalogPackage('react18', 'react', '^18.3.0')
  pw.setCatalogPackage('react19', 'react', '^19.1.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      "@unocss/core": ^0.66.0
      react: ^18.2.0

    catalogs:
      # Don't use React
      react18:
        "@vue/compiler-sfc": ^3.0.0
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
})

it('should create when empty', () => {
  const input = ''
  const pw = parsePnpmWorkspaceYaml(input)
  pw.setCatalogPackage('default', 'react', '^18.2.0')
  pw.setCatalogPackage('vue', 'vue', '^3.0.0')

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
  pw.setCatalogPackage('default', 'react-dom', '^18.3.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      react: &foo ^18.3.0
      react-dom: *foo
    "
  `)

  pw.setCatalogPackage('default', 'react', '^18.2.0')
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
  pw.setCatalogPackage('default', 'react-dom', '^18.3.0')

  expect(pw.toString()).toMatchInlineSnapshot(`
    "defines:
      - &react ^18.3.0

    catalog:
      react: *react
      react-dom: *react
    "
  `)
})
