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
        react: ^18.2.0
        vue: ^3.0.0
      # Not even React 19
      react19:
        react: ^19.0.0
      specific_react18_h18_3_0:
        react: ^18.3.0
      specific_react19_h19_1_0:
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
      react: &foo ^18.2.0
      react-dom: *foo
    catalogs:
      specific_react-dom_h18_3_0:
        react-dom: ^18.3.0
    "
  `)

  pw.setPackage('default', 'react', '^18.2.0')
  expect(pw.toString()).toMatchInlineSnapshot(`
    "catalog:
      react: &foo ^18.2.0
      react-dom: *foo
    catalogs:
      specific_react-dom_h18_3_0:
        react-dom: ^18.3.0
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
      - &react ^18.2.0

    catalog:
      react: *react
      react-dom: *react
    catalogs:
      specific_react-dom_h18_3_0:
        react-dom: ^18.3.0
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

describe('pnpm-workspace-yaml', () => {
  it('should set package in default catalog', () => {
    const workspace = parsePnpmWorkspaceYaml('')
    workspace.setPackage('default', 'foo', '^1.0.0')
    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalog:
        foo: ^1.0.0
      "
    `)
  })

  it('should set package in named catalog', () => {
    const workspace = parsePnpmWorkspaceYaml('')
    workspace.setPackage('dev', 'foo', '^1.0.0')
    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalogs:
        dev:
          foo: ^1.0.0
      "
    `)
  })

  it('should get package catalogs', () => {
    const workspace = parsePnpmWorkspaceYaml(`
catalog:
  foo: ^1.0.0
catalogs:
  dev:
    bar: ^2.0.0
  prod:
    foo: ^3.0.0
`)
    expect(workspace.getPackageCatalogs('foo')).toEqual(['prod', 'default'])
    expect(workspace.getPackageCatalogs('bar')).toEqual(['dev'])
    expect(workspace.getPackageCatalogs('baz')).toEqual([])
  })

  it('should handle version conflicts by creating version-specific catalogs', () => {
    const workspace = parsePnpmWorkspaceYaml(`
catalogs:
  dev:
    foo: ^1.0.0
`)
    // Adding the same package with the same version should not create a new entry
    workspace.setPackage('dev', 'foo', '^1.0.0')
    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalogs:
        dev:
          foo: ^1.0.0
      "
    `)

    // Adding the same package with a different version should create a new catalog with version-based name
    workspace.setPackage('dev', 'foo', '^2.0.0')
    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalogs:
        dev:
          foo: ^1.0.0
        specific_dev_h2_0_0:
          foo: ^2.0.0
      "
    `)

    // Adding the same package with yet another version should create another new catalog with version-based name
    workspace.setPackage('dev', 'foo', '~3.0.0')
    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalogs:
        dev:
          foo: ^1.0.0
        specific_dev_h2_0_0:
          foo: ^2.0.0
        specific_dev_t3_0_0:
          foo: ~3.0.0
      "
    `)

    // Test with default catalog as well
    const workspace2 = parsePnpmWorkspaceYaml(`
catalog:
  bar: ^1.0.0
`)
    workspace2.setPackage('default', 'bar', '^2.0.0')
    expect(workspace2.toString()).toMatchInlineSnapshot(`
      "catalog:
        bar: ^1.0.0
      catalogs:
        specific_bar_h2_0_0:
          bar: ^2.0.0
      "
    `)

    // Test with exact version vs caret version
    const workspace3 = parsePnpmWorkspaceYaml(`
catalogs:
  test:
    baz: 1.0.0
`)
    workspace3.setPackage('test', 'baz', '^1.0.0')
    expect(workspace3.toString()).toMatchInlineSnapshot(`
      "catalogs:
        test:
          baz: 1.0.0
        specific_test_h1_0_0:
          baz: ^1.0.0
      "
    `)

    // Test with complex version ranges
    const workspace4 = parsePnpmWorkspaceYaml(`
catalogs:
  complex:
    qux: ^2.0.0
`)

    // First, verify that the workspace was properly initialized
    expect(workspace4.toString()).toMatchInlineSnapshot(`
      "catalogs:
        complex:
          qux: ^2.0.0
      "
    `)

    // Now set the package with a different version
    workspace4.setPackage('complex', 'qux', '^2.5.0')

    // The expected result should have both the original catalog and a new catalog with a version-based name
    expect(workspace4.toString()).toMatchInlineSnapshot(`
      "catalogs:
        complex:
          qux: ^2.0.0
        specific_complex_h2_5_0:
          qux: ^2.5.0
      "
    `)

    // Test with same version format but different values
    const workspace5 = parsePnpmWorkspaceYaml(`
catalogs:
  versions:
    lib: 1.0.0
`)
    workspace5.setPackage('versions', 'lib', '1.0.1')

    expect(workspace5.toString()).toMatchInlineSnapshot(`
      "catalogs:
        versions:
          lib: 1.0.0
        specific_versions_1_0_1:
          lib: 1.0.1
      "
    `)
  })

  it('should handle simple version conflicts correctly', () => {
    const workspace = parsePnpmWorkspaceYaml(`
catalogs:
  simple:
    test: 1.0.0
`)
    workspace.setPackage('simple', 'test', '2.0.0')

    expect(workspace.toString()).toMatchInlineSnapshot(`
      "catalogs:
        simple:
          test: 1.0.0
        specific_simple_2_0_0:
          test: 2.0.0
      "
    `)
  })
})
