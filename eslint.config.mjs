import nextConfig from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'scripts/**', 'next-env.d.ts', '*.config.*'],
  },
  ...nextConfig,
  {
    rules: {
      // React Compiler diagnostics inherited from upstream solana/explorer
      // code. Demoted to warnings until that code is reworked — new code
      // should keep them clean. rules-of-hooks violations stay errors.
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      // Stock explorer copy is full of literal quotes/apostrophes in JSX.
      'react/no-unescaped-entities': 'off',
    },
  },
];
