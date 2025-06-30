import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // Only CommonJS, no ESM
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: false, // Don't clean - we want to keep tsc files
  dts: false, // Let tsc handle type declarations
  loader: {
    '.json': 'json'
  },
  onSuccess: 'cp -r src/types dist/'
});
