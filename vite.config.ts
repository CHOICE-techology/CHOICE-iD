// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      // Add build-time protection by removing console logs
      plugins: [
        {
          name: 'remove-console',
          renderChunk(code) {
            return code.replace(/console\.log\(.*?\);?/g, '');
          },
        },
      ],
    },
  },
  server: {
    // Add origin locking feature
    cors: {
      origin: ['https://yourdomain.com'], // Replace with your actual domain
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  },
});