import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // string con la fecha/hora de la build
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
