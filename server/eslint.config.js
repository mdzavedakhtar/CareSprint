const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        node: true,
        process: true,
        console: true,
        module: true,
        require: true,
        __dirname: true,
        __filename: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        Date: true,
        Number: true,
        Math: true,
        Array: true,
        String: true,
        Boolean: true,
        Object: true,
        Error: true,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
    },
  },
];
