import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Minimal ESLint configuration with only essential Next.js rules
const eslintConfig = [
  {
    ignores: ['**/*'],  // Ignore all files by default
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
  },
  {
    files: ['src/**/*'],  // But apply minimal Next.js rules to source files
    ...compat.extends('next/core-web-vitals')[0],
    rules: {
      // Disable all rules except critical Next.js ones
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-async-client-component': 'warn',
      // Add other rules you want to keep here
    }
  }
];

export default eslintConfig;
