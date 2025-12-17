#!/usr/bin/env node
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8080', 10);
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(' Starting server with configuration:');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Host: ${HOST}`);
console.log(`   Port: ${PORT}`);

const server = await createServer({
  configFile: './vite.config.js',
  mode: 'production',
  preview: {
    host: HOST,
    port: PORT,
    strictPort: true
  }
});

await server.listen();

console.log(`Server running at http://${HOST}:${PORT}`);
