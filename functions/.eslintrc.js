module.exports = {
  parser: "@babel/eslint-parser",
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    requireConfigFile: false,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "quotes": "off",
    "semi": "off",
    "object-curly-spacing": "off",
    "indent": "off",
    "no-unused-vars": "off",
    "no-trailing-spaces": "off",
    "max-len": "off",
    "comma-dangle": "off",
    "require-jsdoc": "off",
    "eol-last": "off",
  },
  plugins: [
    "@babel/eslint-plugin",
  ],
};
