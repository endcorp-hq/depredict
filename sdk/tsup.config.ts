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
  // Externalize ALL Node.js modules and problematic dependencies
  external: [
    // Solana dependencies
    '@coral-xyz/anchor', 
    '@solana/web3.js', 
    '@solana/spl-token', 
    '@metaplex-foundation/mpl-core',
    
    // Node.js modules that don't work in React Native
    'http',
    'https', 
    'fs',
    'path',
    'os',
    'tty',
    'stream',
    'crypto',
    'util',
    'events',
    'assert',
    'constants',
    'domain',
    'punycode',
    'string_decoder',
    'timers',
    'vm',
    'worker_threads',
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'http2',
    'net',
    'perf_hooks',
    'readline',
    'repl',
    'tls',
    'v8',
    'url',
    'querystring',
    'zlib',
    'buffer',
    
    // HTTP client libraries
    'axios',
    'form-data',
    'follow-redirects',
    
    // Other problematic dependencies
    'supports-color',
    'debug',
    'mime-types',
    'asynckit',
    'combined-stream',
    'delayed-stream',
    'has-flag',
    'es-set-tostringtag',
    'hasown',
    'populate',
    'proxy-from-env'
  ],
  // Only bundle your own code and essential dependencies
  noExternal: ['bn.js'],
  target: 'es2020',
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.json': 'json'
    };
    options.define = {
      ...options.define,
      'global': 'globalThis',
      'process.env.NODE_ENV': '"production"'
    };
  }
});