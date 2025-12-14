import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync } from 'fs';

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
        // Add content hash for cache busting
        entryFileNames: 'scratch-off.[hash].[format].js',
        assetFileNames: 'scratch-off.[hash].[ext]'
      }
    },
    copyPublicDir: true
  },
  plugins: [
    {
      name: 'copy-demo',
      closeBundle() {
        // Find the generated IIFE file with hash
        const distDir = resolve(__dirname, 'dist');
        const files = readdirSync(distDir);
        const iifeFile = files.find(f => f.includes('.iife.') && f.endsWith('.js'));

        if (!iifeFile) {
          console.error('Could not find IIFE bundle');
          return;
        }

        // Read the demo HTML and update script reference for production
        let html = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
        html = html.replace(
          '<script type="module" src="/src/scratch-off.ts"></script>',
          `<script src="./${iifeFile}"></script>`
        );
        writeFileSync(resolve(__dirname, 'dist/index.html'), html);
      }
    }
  ]
});
