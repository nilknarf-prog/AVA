import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build de produção do módulo Atena. Sai para ../atena (servido em /atena/ na Vercel).
// NÃO usar ../flashcards: essa pasta é o store SRS (deck.md, revisao-hoje.md) do CLAUDE.md.
export default defineConfig({
  plugins: [react()],
  base: '/atena/',
  build: {
    outDir: '../atena',
    emptyOutDir: true,
  },
});
