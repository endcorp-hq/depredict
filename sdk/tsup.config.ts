import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // 🔁 dual build
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: {
    resolve: true,
    entry: 'src/index.ts'
  },
  loader: {
    '.json': 'copy'
  },
  onSuccess: 'cp -r src/types dist/'
});
