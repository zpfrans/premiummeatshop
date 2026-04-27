export default [
  {
    ignores: ["node_modules/**", "uploads/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {}
  }
];
