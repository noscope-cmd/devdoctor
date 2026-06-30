/**
 * Command implementations. Each command returns a string to print (or writes
 * directly for streaming output) and an exit code.
 * @packageDocumentation
 */

import { writeFile } from 'node:fs/promises';
import { type CheckContext, type DiagnosticReport, Severity } from '../core/types.js';
import { type CheckRegistry } from '../core/registry.js';
import { runChecks, buildContext } from '../core/engine.js';
import { createRegistry } from '../checks/index.js';
import { loadPlugins } from '../plugins/index.js';
import { collectSystemInfo } from '../checks/system.js';
import { detectProject } from '../checks/project.js';
import { scanPorts, killPort, listListeningPorts } from '../checks/ports.js';
import { gitDiagnostics } from '../checks/git-diagnostics.js';
import { dockerDiagnostics } from '../checks/docker-diagnostics.js';
import {
  renderReport,
  renderSystem,
  renderProject,
  banner,
} from '../reporters/terminal.js';
import { toJson, toYamlReport } from '../reporters/data.js';
import { toMarkdown } from '../reporters/markdown.js';
import { toHtml } from '../reporters/html.js';
import { type Format, type ParsedArgs, resolveFormat } from './args.js';
import { c } from '../ui/colors.js';
import { icons, severityBadge, severityColor } from '../ui/icons.js';
import { table, box, Spinner } from '../ui/render.js';
import { VERSION } from '../core/engine.js';

/** Result of a command execution. */
export interface CommandResult {
  output: string;
  code: number;
}

interface RunEnv {
  args: ParsedArgs;
  ctx: CheckContext;
  registry: CheckRegistry;
  format: Format;
  verbose: boolean;
  quiet: boolean;
}

/** Prepare shared environment (registry, plugins, context). */
export async function prepare(args: ParsedArgs): Promise<RunEnv> {
  const ctx = buildContext({ cwd: process.cwd(), verbose: Boolean(args.flags.verbose) });
  const registry = createRegistry();
  const extraPaths =
    typeof args.flags.plugin === 'string' ? [args.flags.plugin] : undefined;
  await loadPlugins(registry, { cwd: ctx.cwd, extraPaths });
  return {
    args,
    ctx,
    registry,
    format: resolveFormat(args.flags),
    verbose: Boolean(args.flags.verbose),
    quiet: Boolean(args.flags.quiet),
  };
}

/** Collect the `only` filter as a string array. */
function onlyFilter(args: ParsedArgs): string[] | undefined {
  const v = args.flags.only;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim());
  return undefined;
}

/** Optionally write output to a file specified by -o/--output. */
async function maybeWriteFile(env: RunEnv, content: string): Promise<string | null> {
  const out = env.args.flags.output;
  if (typeof out === 'string') {
    await writeFile(out, content, 'utf8');
    return out;
  }
  return null;
}

/** Serialize a report in the requested format. */
function serializeReport(report: DiagnosticReport, env: RunEnv): string {
  switch (env.format) {
    case 'json':
      return toJson(report);
    case 'yaml':
      return toYamlReport(report);
    case 'markdown':
      return toMarkdown(report);
    case 'html':
      return toHtml(report);
    default:
      return renderReport(report, { verbose: env.verbose, quiet: env.quiet, showBanner: true });
  }
}

/** Run the engine with an optional spinner for human output. */
async function runWithSpinner(
  env: RunEnv,
  label: string,
  only?: string[],
): Promise<DiagnosticReport> {
  const useSpinner = env.format === 'human' && !env.quiet && process.stdout.isTTY;
  const spinner = useSpinner ? new Spinner(label).start() : null;
  const report = await runChecks(env.registry, env.ctx, {
    cwd: env.ctx.cwd,
    verbose: env.verbose,
    only,
    onProgress: (done, total) => spinner?.update(`${label} (${done}/${total})`),
  });
  spinner?.stop();
  return report;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/** `devdoctor doctor` / `tools` — run tool checks. */
export async function cmdDoctor(env: RunEnv): Promise<CommandResult> {
  const report = await runWithSpinner(env, 'Scanning environment', onlyFilter(env.args));
  const out = serializeReport(report, env);
  const file = await maybeWriteFile(env, out);
  return {
    output: file ? c.green(`${icons.ok} Report written to ${file}`) : out,
    code: report.score.errors > 0 ? 1 : 0,
  };
}

/** `devdoctor scan` — everything: tools + system + project + git + docker. */
export async function cmdScan(env: RunEnv): Promise<CommandResult> {
  const [report, sys, project, git, docker] = await Promise.all([
    runWithSpinner(env, 'Running full scan'),
    collectSystemInfo(env.ctx),
    detectProject(env.ctx),
    gitDiagnostics(env.ctx),
    dockerDiagnostics(env.ctx),
  ]);

  const full: DiagnosticReport = {
    ...report,
    sections: { system: sys, project, git, docker },
  };

  if (env.format !== 'human') {
    const out = serializeReport(full, env);
    const file = await maybeWriteFile(env, out);
    return { output: file ? c.green(`Report written to ${file}`) : out, code: 0 };
  }

  const parts = [
    banner(),
    renderSystem(sys),
    renderProject(project),
    renderReport(report, { verbose: env.verbose, quiet: env.quiet }),
    renderDiagnosticGroup('Git Diagnostics', git, env),
    renderDiagnosticGroup('Docker Diagnostics', docker, env),
  ];
  return { output: parts.join('\n'), code: report.score.errors > 0 ? 1 : 0 };
}

/** `devdoctor system` — system information. */
export async function cmdSystem(env: RunEnv): Promise<CommandResult> {
  const sys = await collectSystemInfo(env.ctx);
  if (env.format === 'json') return { output: JSON.stringify(sys, null, 2), code: 0 };
  if (env.format === 'yaml') {
    const { toYaml } = await import('../utils/yaml.js');
    return { output: toYaml(sys), code: 0 };
  }
  return { output: renderSystem(sys), code: 0 };
}

/** `devdoctor project` — project detection. */
export async function cmdProject(env: RunEnv): Promise<CommandResult> {
  const project = await detectProject(env.ctx);
  if (env.format === 'json') return { output: JSON.stringify(project, null, 2), code: 0 };
  if (env.format === 'yaml') {
    const { toYaml } = await import('../utils/yaml.js');
    return { output: toYaml(project), code: 0 };
  }
  return { output: renderProject(project), code: 0 };
}

/** `devdoctor git` — git diagnostics. */
export async function cmdGit(env: RunEnv): Promise<CommandResult> {
  const results = await gitDiagnostics(env.ctx);
  const code = results.some((r) => r.severity === Severity.Error) ? 1 : 0;
  if (env.format === 'json') return { output: JSON.stringify(results, null, 2), code };
  return { output: renderDiagnosticGroup('Git Diagnostics', results, env), code };
}

/** `devdoctor docker` — docker diagnostics. */
export async function cmdDocker(env: RunEnv): Promise<CommandResult> {
  const results = await dockerDiagnostics(env.ctx);
  const code = results.some((r) => r.severity === Severity.Error) ? 1 : 0;
  if (env.format === 'json') return { output: JSON.stringify(results, null, 2), code };
  return { output: renderDiagnosticGroup('Docker Diagnostics', results, env), code };
}

/** `devdoctor ports` and its flags. */
export async function cmdPorts(env: RunEnv): Promise<CommandResult> {
  const { args, ctx } = env;

  // --kill <port>
  const killArg = args.flags.kill;
  if (killArg !== undefined && killArg !== false) {
    const port = Number(killArg === true ? args.positionals[0] : killArg);
    if (!port) return { output: c.red('Usage: devdoctor ports --kill <port>'), code: 2 };
    const killed = await killPort(ctx, port);
    if (killed.length) {
      return {
        output: c.green(`${icons.ok} Killed PID(s) ${killed.join(', ')} listening on port ${port}`),
        code: 0,
      };
    }
    return { output: c.yellow(`No listening process found on port ${port}`), code: 1 };
  }

  const onlyUsed = Boolean(args.flags.used);
  const onlyFree = Boolean(args.flags.free);
  let entries = onlyUsed
    ? await listListeningPorts(ctx)
    : await scanPorts(ctx, { includeFree: !onlyUsed });
  if (onlyFree) entries = entries.filter((e) => e.status === 'Free');
  if (onlyUsed) entries = entries.filter((e) => e.status === 'In Use');

  if (env.format === 'json') return { output: JSON.stringify(entries, null, 2), code: 0 };
  if (env.format === 'yaml') {
    const { toYaml } = await import('../utils/yaml.js');
    return { output: toYaml(entries), code: 0 };
  }

  const rows = entries.map((e) => [
    c.bold(String(e.port)),
    e.status === 'In Use' ? c.yellow('In Use') : c.green('Free'),
    e.process ? c.cyan(e.process) : c.gray('—'),
    e.pid ? String(e.pid) : '',
    e.address ?? '',
    e.protocol ?? 'TCP',
  ]);
  const t = table(['PORT', 'STATUS', 'PROCESS', 'PID', 'LOCAL ADDRESS', 'PROTO'], rows);
  return { output: `${c.bold(c.cyan('\nLocal Ports'))}\n\n${t}`, code: 0 };
}

/** `devdoctor fix` — list problems and fixes only. */
export async function cmdFix(env: RunEnv): Promise<CommandResult> {
  const report = await runWithSpinner(env, 'Finding issues');
  const problems = report.groups
    .flatMap((g) => g.results)
    .filter((r) => r.severity === Severity.Warning || r.severity === Severity.Error);

  if (!problems.length) {
    return { output: c.green(`\n${icons.ok} No issues found — your environment looks healthy!`), code: 0 };
  }

  const lines: string[] = [c.bold(c.cyan(`\n${icons.search} ${problems.length} issue(s) found\n`))];
  for (const r of problems) {
    lines.push(`${severityBadge(r.severity)} ${severityColor(r.severity, c.bold(r.title))} — ${r.summary}`);
    if (r.detail) lines.push(c.gray(`   ${r.detail}`));
    for (const fix of r.fixes ?? []) {
      lines.push(c.dim(`   ${icons.fix} ${fix.description}`));
      if (fix.command) lines.push(c.cyan(`      $ ${fix.command}`));
      if (fix.url) lines.push(c.blue(`      ${fix.url}`));
    }
    lines.push('');
  }
  return { output: lines.join('\n'), code: report.score.errors > 0 ? 1 : 0 };
}

/** `devdoctor report` — generate a report file (defaults to markdown). */
export async function cmdReport(env: RunEnv): Promise<CommandResult> {
  const [report, sys, project] = await Promise.all([
    runWithSpinner(env, 'Building report'),
    collectSystemInfo(env.ctx),
    detectProject(env.ctx),
  ]);
  const full: DiagnosticReport = { ...report, sections: { system: sys, project } };

  // Default to markdown for `report` if no explicit format.
  const fmt: Format = env.format === 'human' ? 'markdown' : env.format;
  const envWithFmt = { ...env, format: fmt };
  const out = serializeReport(full, envWithFmt);
  const file = await maybeWriteFile(envWithFmt, out);
  if (file) return { output: c.green(`${icons.ok} ${fmt.toUpperCase()} report written to ${file}`), code: 0 };
  return { output: out, code: 0 };
}

/** `devdoctor update` — check own version against npm (best-effort). */
export async function cmdUpdate(env: RunEnv): Promise<CommandResult> {
  const r = await env.ctx.run('npm', ['view', 'devdoctor', 'version'], { timeoutMs: 6000 });
  const latest = r.stdout.trim();
  if (!latest) {
    return {
      output: c.yellow(`Could not reach npm. You are running v${VERSION}.`),
      code: 0,
    };
  }
  if (latest === VERSION) {
    return { output: c.green(`${icons.ok} DevDoctor is up to date (v${VERSION})`), code: 0 };
  }
  return {
    output: box(
      `${c.yellow('Update available')}\n` +
        `Current: v${VERSION}\nLatest:  ${c.green(latest)}\n\n` +
        c.cyan('npm install -g devdoctor@latest'),
      { title: 'DevDoctor Update' },
    ),
    code: 0,
  };
}

/** Render a list of diagnostic results under a titled section. */
function renderDiagnosticGroup(title: string, results: import('../core/types.js').CheckResult[], _env: RunEnv): string {
  const lines = [c.bold(c.cyan(`\n${icons.gear} ${title}`)), c.gray('─'.repeat(title.length + 4))];
  for (const r of results) {
    let summary = r.summary;
    summary = severityColor(r.severity, summary);
    lines.push(`  ${severityBadge(r.severity)} ${c.bold(r.title.padEnd(26))} ${summary}`);
    if (r.detail && r.severity !== Severity.Ok) lines.push(c.gray(`     ${icons.arrow} ${r.detail}`));
    for (const fix of r.fixes ?? []) {
      lines.push(c.dim(`     ${icons.fix} ${fix.description}`));
      if (fix.command) lines.push(c.cyan(`        $ ${fix.command}`));
    }
  }
  return lines.join('\n');
}
