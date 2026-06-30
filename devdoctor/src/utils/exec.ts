/**
 * A small, dependency-free, memoizing command runner.
 *
 * - Resolves executables via PATH (cross-platform, handles `.exe`/`.cmd`).
 * - Caches identical invocations within a single process run.
 * - Enforces per-command timeouts so a hung tool can't stall the scan.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { join, delimiter } from 'node:path';
import type { CommandResult, CommandRunner, RunOptions } from '../core/types.js';

const DEFAULT_TIMEOUT = 4000;

/** Windows executable extensions to probe when resolving a bare name. */
const WIN_EXTS = ['.exe', '.cmd', '.bat', '.com', ''];

async function isExecutable(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return true;
  } catch {
    // On Windows X_OK is unreliable; fall back to existence.
    try {
      await access(file, constants.F_OK);
      return process.platform === 'win32';
    } catch {
      return false;
    }
  }
}

/**
 * Resolve the absolute path of an executable on PATH, or null if not found.
 */
async function resolveWhich(bin: string): Promise<string | null> {
  // Absolute or relative path passed directly.
  if (bin.includes('/') || bin.includes('\\')) {
    return (await isExecutable(bin)) ? bin : null;
  }
  const pathEnv = process.env.PATH ?? process.env.Path ?? '';
  const dirs = pathEnv.split(delimiter).filter(Boolean);
  const exts = process.platform === 'win32' ? WIN_EXTS : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, bin + ext);
      if (await isExecutable(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Create a memoizing {@link CommandRunner}. Each unique (cmd, args, cwd)
 * combination is executed at most once unless `fresh` is passed.
 */
export function createRunner(): CommandRunner {
  const cmdCache = new Map<string, Promise<CommandResult>>();
  const whichCache = new Map<string, Promise<string | null>>();

  const exec = (
    cmd: string,
    args: readonly string[] = [],
    opts: RunOptions = {},
  ): Promise<CommandResult> => {
    const key = JSON.stringify([cmd, args, opts.cwd ?? '']);
    if (!opts.fresh && cmdCache.has(key)) return cmdCache.get(key)!;

    const promise = new Promise<CommandResult>((resolve) => {
      const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
      let stdout = '';
      let stderr = '';
      let settled = false;

      const finish = (r: CommandResult) => {
        if (settled) return;
        settled = true;
        resolve(r);
      };

      let child;
      try {
        // Windows can't spawn `.cmd`/`.bat` shims (npm, pnpm, yarn, …) directly
        // when shell:false. Route those through cmd.exe explicitly. We pass the
        // command as a pre-resolved absolute path where possible and never
        // interpolate args into a shell string, so this stays injection-safe.
        const isWin = process.platform === 'win32';
        const isBatch = isWin && /\.(cmd|bat)$/i.test(cmd);
        if (isBatch) {
          child = spawn(
            process.env.ComSpec || 'cmd.exe',
            ['/d', '/s', '/c', cmd, ...args],
            { cwd: opts.cwd, shell: false, windowsHide: true, env: process.env },
          );
        } else {
          child = spawn(cmd, [...args], {
            cwd: opts.cwd,
            shell: false,
            windowsHide: true,
            env: process.env,
          });
        }
      } catch {
        finish({ ok: false, code: null, stdout: '', stderr: '', notFound: true });
        return;
      }

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        finish({ ok: false, code: null, stdout, stderr: stderr || 'timed out', notFound: false });
      }, timeoutMs);
      timer.unref?.();

      child.stdout?.on('data', (d) => (stdout += d.toString()));
      child.stderr?.on('data', (d) => (stderr += d.toString()));

      child.on('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        finish({
          ok: false,
          code: null,
          stdout,
          stderr: err.message,
          notFound: err.code === 'ENOENT',
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        finish({ ok: code === 0, code, stdout, stderr, notFound: false });
      });
    });

    if (!opts.fresh) cmdCache.set(key, promise);
    return promise;
  };

  const runner = exec as CommandRunner;
  runner.which = (bin: string) => {
    if (whichCache.has(bin)) return whichCache.get(bin)!;
    const p = resolveWhich(bin);
    whichCache.set(bin, p);
    return p;
  };
  return runner;
}

/**
 * Extract the first semver-like token from arbitrary CLI version output.
 * Handles `git version 2.39.3`, `v20.11.0`, `Python 3.12.1`, etc.
 */
export function parseVersion(text: string): string | undefined {
  const m = text.match(/(\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)/);
  return m?.[1];
}

/** Compare two semver-ish strings. Returns -1, 0, or 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}
