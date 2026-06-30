/**
 * Plugin system.
 *
 * A plugin is a module that default-exports a {@link Plugin} object (or a
 * factory returning one). Plugins receive the {@link CheckRegistry} and can
 * register additional checks. DevDoctor auto-loads plugins from:
 *
 *   1. `devdoctor.config.{js,mjs}` in the current working directory.
 *   2. The `~/.devdoctor/plugins/` directory.
 *   3. Any path passed via `--plugin <path>`.
 *
 * Example plugin:
 * ```js
 * // devdoctor.config.mjs
 * import { defineCheck, Severity } from 'devdoctor';
 * export default {
 *   name: 'my-plugin',
 *   register(registry) {
 *     registry.add(defineCheck({
 *       id: 'deno', title: 'Deno', category: 'languages',
 *       run: async (ctx) => {
 *         const p = await ctx.run.which('deno');
 *         return { id:'deno', title:'Deno', severity: p ? Severity.Ok : Severity.Warning,
 *                  summary: p ? 'Installed' : 'Not installed' };
 *       },
 *     }));
 *   },
 * };
 * ```
 * @packageDocumentation
 */

import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { access, readdir } from 'node:fs/promises';
import type { CheckRegistry } from '../core/registry.js';

/** A DevDoctor plugin. */
export interface Plugin {
  /** Unique plugin name. */
  name: string;
  /** Called once to register checks. */
  register(registry: CheckRegistry): void | Promise<void>;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadModule(path: string): Promise<Plugin | null> {
  try {
    const mod = await import(pathToFileURL(resolve(path)).href);
    const candidate = mod.default ?? mod.plugin ?? mod;
    const plugin = typeof candidate === 'function' ? candidate() : candidate;
    if (plugin && typeof plugin.register === 'function') return plugin as Plugin;
  } catch (err) {
    process.stderr.write(`devdoctor: failed to load plugin ${path}: ${(err as Error).message}\n`);
  }
  return null;
}

/** Discover and load all available plugins, registering their checks. */
export async function loadPlugins(
  registry: CheckRegistry,
  opts: { cwd?: string; extraPaths?: string[] } = {},
): Promise<Plugin[]> {
  const cwd = opts.cwd ?? process.cwd();
  const candidates: string[] = [];

  for (const f of ['devdoctor.config.mjs', 'devdoctor.config.js']) {
    const p = join(cwd, f);
    if (await exists(p)) candidates.push(p);
  }

  const pluginDir = join(homedir(), '.devdoctor', 'plugins');
  if (await exists(pluginDir)) {
    try {
      const files = await readdir(pluginDir);
      for (const f of files) {
        if (f.endsWith('.mjs') || f.endsWith('.js')) candidates.push(join(pluginDir, f));
      }
    } catch {
      /* ignore */
    }
  }

  candidates.push(...(opts.extraPaths ?? []));

  const loaded: Plugin[] = [];
  for (const path of candidates) {
    const plugin = await loadModule(path);
    if (plugin) {
      await plugin.register(registry);
      loaded.push(plugin);
    }
  }
  return loaded;
}
