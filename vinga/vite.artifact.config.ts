import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Single-file build: everything (JS, CSS, fonts) inlined into one HTML,
 * used to publish the app as a self-contained shareable page. The neural
 * voice module is stubbed out — its model can't be fetched under the
 * strict CSP of shared pages, and bundling it would inline ~70 MB of
 * onnxruntime WASM.
 *   npx vite build --config vite.artifact.config.ts
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  define: { __NEURAL_VOICE__: 'false' },
  resolve: {
    alias: {
      '@mintplex-labs/piper-tts-web': fileURLToPath(new URL('./src/lib/piperStub.ts', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-artifact',
    target: 'es2020',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
