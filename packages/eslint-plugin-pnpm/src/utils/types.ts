declare module '@typescript-eslint/utils/ts-eslint' {
  interface SharedConfigurationSettings {
    pnpm?: {
      /**
       * The action to take when `pnpm-workspace.yaml` is not found.
       *
       * @default 'error'
       */
      onPnpmWorkspaceYamlMiss?: 'error' | 'create'
    }
  }
}

export {}
