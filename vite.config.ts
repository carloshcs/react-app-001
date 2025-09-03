import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Notion mind map application. We enable the
// React plugin to get JSX/TSX support out of the box. The output directory
// defaults to `dist` for production builds.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});