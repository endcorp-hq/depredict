import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist/cjs', //build for commonjs only, esm is handled by tsc
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  loader: {
    '.json': 'json'
  },
  // Preserve all exports
  treeshake: false,
  // Ensure external dependencies are handled correctly
  external: ['@coral-xyz/anchor', '@solana/web3.js', '@solana/spl-token', '@metaplex-foundation/mpl-core'],
  // Force all exports to be included
  noExternal: ['bn.js']
});