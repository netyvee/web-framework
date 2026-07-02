import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      // The components render via react-dom/server in tests; next/image and
      // next/link are mocked to their essential markup (src/alt/href) — real
      // Next rendering parity is proven against the site baseline, not here.
      'next/image': path.resolve(__dirname, 'tests/mocks/next-image.tsx'),
      'next/link': path.resolve(__dirname, 'tests/mocks/next-link.tsx'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
