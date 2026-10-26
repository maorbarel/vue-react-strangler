import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  {
    files: ["apps/legacy-vue/**/*.{js,vue}"],
    extends: [...pluginVue.configs["flat/recommended"]],
    languageOptions: { globals: globals.browser },
    rules: { "vue/multi-word-component-names": "off" },
  },
  {
    files: ["apps/shell-react/**/*.{ts,tsx}", "packages/**/*.ts", "e2e/**/*.ts", "playwright.config.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/shell-react/src/**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["**/*.config.js", "scripts/**/*.mjs", "apps/legacy-vue/webpack.config.js"],
    languageOptions: { globals: globals.node },
  },
);
