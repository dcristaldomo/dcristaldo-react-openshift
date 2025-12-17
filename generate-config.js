#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  VITE_API_URL: process.env.VITE_API_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'production',
  APP_VERSION: process.env.APP_VERSION || '1.0.0'
};

const configContent = `window.__CONFIG__ = ${JSON.stringify(config, null, 2)};`;

const outputPath = join(__dirname, 'dist', 'config.js');

writeFileSync(outputPath, configContent, 'utf8');

console.log('Runtime config generated at:', outputPath);
console.log('Configuration:', config);
