/**
 * Project detection.
 *
 * Inspects the current working directory to recognize the language,
 * framework, package manager, build tool, dependencies, and scripts.
 *
 * @packageDocumentation
 */

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { CheckContext } from '../core/types.js';

/** Result of project detection. */
export interface ProjectInfo {
  detected: boolean;
  languages: string[];
  frameworks: string[];
  packageManager?: string;
  buildTool?: string;
  dependencies: number;
  devDependencies: number;
  scripts: Record<string, string>;
  files: string[];
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p: string): Promise<any | null> {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

/** Map dependency names to frameworks. */
const JS_FRAMEWORK_MAP: Array<[RegExp, string]> = [
  [/^next$/, 'Next.js'],
  [/^nuxt$/, 'Nuxt'],
  [/^react$/, 'React'],
  [/^vue$/, 'Vue'],
  [/^@angular\/core$/, 'Angular'],
  [/^svelte$/, 'Svelte'],
  [/^express$/, 'Express'],
  [/^@nestjs\/core$/, 'NestJS'],
  [/^astro$/, 'Astro'],
  [/^vite$/, 'Vite'],
];

const PY_FRAMEWORK_MAP: Array<[RegExp, string]> = [
  [/fastapi/i, 'FastAPI'],
  [/django/i, 'Django'],
  [/flask/i, 'Flask'],
];

/** Detect the project rooted at `ctx.cwd`. */
export async function detectProject(ctx: CheckContext): Promise<ProjectInfo> {
  const cwd = ctx.cwd;
  const info: ProjectInfo = {
    detected: false,
    languages: [],
    frameworks: [],
    dependencies: 0,
    devDependencies: 0,
    scripts: {},
    files: [],
  };

  // ---- Node.js / JS ecosystem ----
  const pkgPath = join(cwd, 'package.json');
  if (await exists(pkgPath)) {
    const pkg = await readJson(pkgPath);
    if (pkg) {
      info.detected = true;
      info.languages.push('JavaScript/TypeScript');
      info.files.push('package.json');
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      info.dependencies = Object.keys(pkg.dependencies ?? {}).length;
      info.devDependencies = Object.keys(pkg.devDependencies ?? {}).length;
      info.scripts = pkg.scripts ?? {};
      for (const dep of Object.keys(deps)) {
        for (const [re, name] of JS_FRAMEWORK_MAP) {
          if (re.test(dep) && !info.frameworks.includes(name)) info.frameworks.push(name);
        }
      }
      // Package manager from lockfile / packageManager field.
      if (pkg.packageManager) info.packageManager = pkg.packageManager.split('@')[0];
      else if (await exists(join(cwd, 'pnpm-lock.yaml'))) info.packageManager = 'pnpm';
      else if (await exists(join(cwd, 'yarn.lock'))) info.packageManager = 'yarn';
      else if (await exists(join(cwd, 'bun.lockb'))) info.packageManager = 'bun';
      else if (await exists(join(cwd, 'package-lock.json'))) info.packageManager = 'npm';
      if (await exists(join(cwd, 'tsconfig.json'))) info.buildTool ??= 'tsc';
      if (info.frameworks.includes('Vite')) info.buildTool = 'Vite';
    }
  }

  // ---- Python ----
  for (const f of ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile']) {
    if (await exists(join(cwd, f))) {
      info.detected = true;
      if (!info.languages.includes('Python')) info.languages.push('Python');
      info.files.push(f);
      const content = await readFile(join(cwd, f), 'utf8').catch(() => '');
      for (const [re, name] of PY_FRAMEWORK_MAP) {
        if (re.test(content) && !info.frameworks.includes(name)) info.frameworks.push(name);
      }
      if (f === 'pyproject.toml') {
        if (/\[tool\.poetry\]/.test(content)) info.packageManager ??= 'poetry';
        else if (/\[tool\.uv\]/.test(content) || (await exists(join(cwd, 'uv.lock'))))
          info.packageManager ??= 'uv';
        else info.packageManager ??= 'pip';
      } else if (f === 'Pipfile') info.packageManager ??= 'pipenv';
      else info.packageManager ??= 'pip';
    }
  }

  // ---- Rust ----
  if (await exists(join(cwd, 'Cargo.toml'))) {
    info.detected = true;
    info.languages.push('Rust');
    info.files.push('Cargo.toml');
    info.packageManager ??= 'cargo';
    info.buildTool ??= 'cargo';
  }

  // ---- Go ----
  if (await exists(join(cwd, 'go.mod'))) {
    info.detected = true;
    info.languages.push('Go');
    info.files.push('go.mod');
    info.buildTool ??= 'go';
  }

  // ---- Java / JVM ----
  if (await exists(join(cwd, 'pom.xml'))) {
    info.detected = true;
    info.languages.push('Java');
    info.files.push('pom.xml');
    info.buildTool ??= 'Maven';
  }
  for (const g of ['build.gradle', 'build.gradle.kts']) {
    if (await exists(join(cwd, g))) {
      info.detected = true;
      if (!info.languages.includes('Java')) info.languages.push('Java/Kotlin');
      info.files.push(g);
      info.buildTool ??= 'Gradle';
    }
  }

  // ---- .NET ----
  const dotnet = ['*.csproj', '*.sln'];
  void dotnet;
  // crude: look for a .sln or .csproj by globbing dir
  try {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(cwd);
    if (entries.some((e) => e.endsWith('.csproj') || e.endsWith('.sln') || e.endsWith('.fsproj'))) {
      info.detected = true;
      info.languages.push('.NET');
      info.buildTool ??= 'dotnet';
    }
    // ---- PHP / Laravel ----
    if (entries.includes('composer.json')) {
      info.detected = true;
      info.languages.push('PHP');
      info.files.push('composer.json');
      info.packageManager ??= 'composer';
      const composer = await readJson(join(cwd, 'composer.json'));
      if (composer?.require && Object.keys(composer.require).some((k) => /laravel\/framework/.test(k))) {
        info.frameworks.push('Laravel');
      }
    }
  } catch {
    /* ignore */
  }

  return info;
}
