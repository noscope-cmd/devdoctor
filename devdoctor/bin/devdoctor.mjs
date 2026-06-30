#!/usr/bin/env node
/**
 * Thin launcher for the compiled CLI.
 *
 * Resolves ./dist/cli.js relative to *this* file (not the cwd or the symlink
 * location), so it works correctly when installed globally via `npm i -g` or
 * linked with `npm link`.
 */
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const entry = join(here, '..', 'dist', 'cli.js');

if (!existsSync(entry)) {
  console.error('DevDoctor is not built yet. Run `npm run build` in the project directory.');
  process.exit(1);
}

import(pathToFileURL(entry).href).catch((err) => {
  console.error('Failed to start DevDoctor.');
  console.error(err);
  process.exit(1);
});
