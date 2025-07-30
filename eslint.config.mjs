import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import pluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";
 
const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})
 
const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'plugin:@typescript-eslint/recommended', 'prettier'],
    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      '@next/next/no-page-custom-font': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      'no-undef': 'off',
      '@typescript-eslint/ban-ts-comment': [
        `warn`,
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          'ts-check': 'allow-with-description',
        },
      ],
    },
  }),
]
 
export default eslintConfig