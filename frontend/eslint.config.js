
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.vscode/',
      'eslint.config.js',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
      files: ['src/**/*.{ts,tsx}'],
      languageOptions: {
          parserOptions: {
              project: true,
              tsconfigRootDir: import.meta.dirname,
          },
      },
      rules: {
          '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
          '@typescript-eslint/no-explicit-any': 'warn',
      }
  },
   {
     ...pluginPrettierRecommended,
     files: ['src/**/*.{ts,tsx,js,jsx,css,html}'],
     rules: {
         ...pluginPrettierRecommended.rules,
         'prettier/prettier': 'warn',
     }
   },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  }
);
