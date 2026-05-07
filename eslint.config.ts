import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,mjs,cjs,ts}"],
  languageOptions: {
    globals: globals.browser,
    parser: tseslint.parser as any,
    parserOptions: {
      project: true,
    },
  },
  plugins: {
    js,
    "@typescript-eslint": tseslint.plugin as any,
  },
  extends: ["js/recommended", ...tseslint.configs.recommended] as any,
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-require-imports": "off",
  },
});
