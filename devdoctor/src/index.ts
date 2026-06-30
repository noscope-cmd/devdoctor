/**
 * DevDoctor public API.
 *
 * Import this package programmatically to run diagnostics or build plugins.
 *
 * @example
 * ```ts
 * import { createRegistry, buildContext, runChecks } from 'devdoctor';
 * const registry = createRegistry();
 * const ctx = buildContext({ cwd: process.cwd() });
 * const report = await runChecks(registry, ctx);
 * console.log(report.score.percent);
 * ```
 * @packageDocumentation
 */

export * from './core/types.js';
export { CheckRegistry, CATEGORY_LABELS, CATEGORY_ORDER } from './core/registry.js';
export { defineCheck, toolCheck } from './core/check.js';
export { buildContext, runChecks, computeScore, scoreLabel, VERSION } from './core/engine.js';
export { detectPlatform } from './core/platform.js';
export { createRunner, parseVersion, compareVersions } from './utils/exec.js';
export { createRegistry } from './checks/index.js';
export type { Plugin } from './plugins/index.js';
export { loadPlugins } from './plugins/index.js';

// Reporters
export { toJson, toYamlReport, toPlainObject } from './reporters/data.js';
export { toMarkdown } from './reporters/markdown.js';
export { toHtml } from './reporters/html.js';
export { renderReport, renderScore, renderSystem, renderProject, banner } from './reporters/terminal.js';

// Diagnostic modules
export { collectSystemInfo } from './checks/system.js';
export { detectProject } from './checks/project.js';
export { scanPorts, killPort, listListeningPorts } from './checks/ports.js';
export { gitDiagnostics } from './checks/git-diagnostics.js';
export { dockerDiagnostics } from './checks/docker-diagnostics.js';
