module.exports = {
  env: { browser: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended', 'prettier'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'react-refresh/only-export-components': 'off'
  },
  plugins: ['react-refresh']
};
