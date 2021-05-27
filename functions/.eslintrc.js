module.exports = {
  parser: "@babel/eslint-parser",
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    babelOptions: {
      configFile: "./babel.config.json",
    },
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "quotes": "off",
    "semi": "off",
    "object-curly-spacing": "off",
    "indent": "off",
    "no-unused-vars": "off",
  },
  plugins: [
    "@babel/eslint-plugin",
  ],
};
