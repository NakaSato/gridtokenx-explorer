import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

const specWorkspace = (name = 'specs') => ({
  environment: 'jsdom',
  globals: true,
  name,
  server: {
    deps: {
      inline: [
        'change-case',
        '@react-hook/previous',
        '@solana/kit',
        '@solana/rpc',
        '@solana/rpc-spec',
        '@solana/event-target-impl',
        '@solana/addresses',
      ],
    },
  },
  setupFiles: ['./test-setup.ts'],
  testTimeout: 10000,
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Route-group-aware aliases. Most specific first — vite matches in order.
      // The app/ tree is organised into (core), (shared), (solana) route groups,
      // so the old flat ./app/components etc. paths no longer exist.
      '@/app/providers': path.resolve(__dirname, './app/(core)/providers'),
      '@/app/components': path.resolve(__dirname, './app/(shared)/components'),
      '@/app/utils': path.resolve(__dirname, './app/(shared)/utils'),
      '@/app/img': path.resolve(__dirname, './app/(shared)/img'),
      '@/app/validators': path.resolve(__dirname, './app/(solana)/validators'),
      '@/app': path.resolve(__dirname, './app'),
      '@/': path.resolve(__dirname, './'),

      // Short @ aliases
      '@app': path.resolve(__dirname, './app'),
      '@img': path.resolve(__dirname, './app/(shared)/img'),
      '@components': path.resolve(__dirname, './app/(shared)/components'),
      '@providers': path.resolve(__dirname, './app/(core)/providers'),
      '@utils': path.resolve(__dirname, './app/(shared)/utils'),
      '@validators': path.resolve(__dirname, './app/(solana)/validators'),
    },
    conditions: ['browser', 'default'],
  },
  test: {
    coverage: {
      provider: 'v8',
    },
    ...specWorkspace(),
  },
});
