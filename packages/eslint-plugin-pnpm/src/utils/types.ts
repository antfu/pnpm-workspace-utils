declare module '@typescript-eslint/utils/ts-eslint' {
  interface SharedConfigurationSettings {
    pnpm?: {
      /**
       * Whether to create `pnpm-workspace.yaml` if it doesn't exist.
       *
       * @default false
       */
      ensureWorkspaceFile?: boolean
    }
  }
}

export {}
