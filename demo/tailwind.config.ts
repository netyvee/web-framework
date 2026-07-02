import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // framework source both via the file: symlink and directly (Windows-safe)
    './node_modules/@vigil/web-framework/src/**/*.{ts,tsx}',
    '../src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;
