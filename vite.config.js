import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/.
// A relative base ('./') makes the built files work from any sub-path, which is
// all this single-page, hash-navigated app needs. To use an absolute path
// instead, build with:  VITE_BASE_PATH=/your-repo-name/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
  },
});
