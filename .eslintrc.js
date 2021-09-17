module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es2021": true
  },
  "extends": [
    "plugin:mocha/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "mocha/no-exports" : 0,
    "mocha/no-setup-in-describe": 0
  },

};
