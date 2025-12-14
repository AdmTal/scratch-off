import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/scratch-off.ts'),
      name: 'ScratchOff',
      fileName: 'scratch-off',
      formats: ['es', 'umd', 'iife']
    },
    rollupOptions: {
      output: {
        // Use stable filenames for easy embedding
        entryFileNames: (chunkInfo) => {
          return `scratch-off.${chunkInfo.name === 'scratch-off' ? '[format]' : '[name]'}.js`;
        },
        assetFileNames: 'scratch-off.[ext]'
      }
    },
    copyPublicDir: true
  },
  plugins: [
    {
      name: 'copy-demo',
      closeBundle() {
        // Read the demo HTML and update script reference for production
        let html = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
        html = html.replace(
          '<script type="module" src="/src/scratch-off.ts"></script>',
          `<script src="./scratch-off.iife.js"></script>`
        );
        writeFileSync(resolve(__dirname, 'dist/index.html'), html);
      }
    }
  ]
});
