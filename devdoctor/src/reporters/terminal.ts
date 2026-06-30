/**
 * The human-readable terminal reporter — the default "doctor" view.
 * @packageDocumentation
 */

import { Severity, type DiagnosticReport, type CheckResult } from '../core/types.js';
import { c } from '../ui/colors.js';
import { icons, severityBadge } from '../ui/icons.js';
import { box, indent, progressBar, sectionHeader, plural } from '../ui/render.js';
import type { SystemInfo } from '../checks/system.js';
import type { ProjectInfo } from '../checks/project.js';

/** Render the DevDoctor banner. */
export function banner(): string {
  const art = [
    '  ___          ___          _',
    ' |   \\ _____ _|   \\ ___  __| |_ ___ _ _',
    ' | |) / -_) V / |) / _ \\/ _|  _/ _ \\ \'_|',
    ' |___/\\___|\\_/|___/\\___/\\__|\\__\\___/_|',
  ].join('\n');
  return c.cyan(art) + '\n' + c.gray('  Diagnose your development environment') + '\n';
}

/** Render a single check line. */
function renderResult(r: CheckResult, verbose: boolean): string {
  const badge = severityBadge(r.severity);
  const title = c.bold(r.title.padEnd(26));
  let summary = r.summary;
  if (r.severity === Severity.Ok) summary = c.green(summary);
  else if (r.severity === Severity.Warning) summary = c.yellow(summary);
  else if (r.severity === Severity.Error) summary = c.red(summary);
  else summary = c.gray(summary);

  let line = `  ${badge} ${title} ${summary}`;
  if (verbose && r.path) line += c.gray(`  (${r.path})`);
  if (verbose && r.durationMs !== undefined) line += c.gray(`  ${r.durationMs}ms`);

  const extra: string[] = [];
  if (r.detail && (verbose || r.severity !== Severity.Ok)) {
    extra.push(c.gray(`     ${icons.arrow} ${r.detail}`));
  }
  for (const fix of r.fixes ?? []) {
    extra.push(c.dim(`     ${icons.fix} ${fix.description}`));
    if (fix.command) extra.push(c.cyan(`        $ ${fix.command}`));
    if (fix.url && verbose) extra.push(c.blue(`        ${fix.url}`));
  }
  return extra.length ? `${line}\n${extra.join('\n')}` : line;
}

/** Render the full diagnostic report to a colorized string. */
export function renderReport(
  report: DiagnosticReport,
  opts: { verbose?: boolean; quiet?: boolean; showBanner?: boolean } = {},
): string {
  const out: string[] = [];
  if (opts.showBanner && !opts.quiet) out.push(banner());

  for (const group of report.groups) {
    if (opts.quiet) {
      const problems = group.results.filter((r) => r.severity !== Severity.Ok && r.severity !== Severity.Skipped);
      if (!problems.length) continue;
      out.push(sectionHeader(group.label));
      for (const r of problems) out.push(renderResult(r, Boolean(opts.verbose)));
    } else {
      out.push(sectionHeader(group.label));
      for (const r of group.results) out.push(renderResult(r, Boolean(opts.verbose)));
    }
  }

  out.push(renderScore(report));
  return out.join('\n');
}

/** Render the health-score summary box. */
export function renderScore(report: DiagnosticReport): string {
  const s = report.score;
  const lines = [
    progressBar(s.percent),
    '',
    c.bold(scoreColor(s.percent)(s.label)),
    '',
    `${c.green(icons.ok)} ${plural(s.passed, 'check')} passed`,
    `${c.yellow(icons.warning)} ${plural(s.warnings, 'warning')}`,
    `${c.red(icons.error)} ${plural(s.errors, 'critical issue')}`,
  ];
  if (s.skipped) lines.push(`${c.gray(icons.skipped)} ${plural(s.skipped, 'check')} skipped`);
  return '\n' + box(lines.join('\n'), { title: 'Development Environment', color: scoreColor(s.percent) });
}

function scoreColor(p: number) {
  return p >= 85 ? c.brightGreen : p >= 60 ? c.yellow : c.brightRed;
}

/** Render system information panel. */
export function renderSystem(info: SystemInfo): string {
  const rows: Array<[string, string]> = [
    ['OS', info.osName],
    ['Kernel', info.kernel],
    ['Architecture', info.arch],
    ['CPU', `${info.cpu} (${info.cpuCores} cores)`],
    ['Memory', `${info.memoryUsed} / ${info.memoryTotal} (${info.memoryPercent}%)`],
  ];
  if (info.diskTotal)
    rows.push(['Disk', `${info.diskUsed} / ${info.diskTotal} (${info.diskPercent}%)`]);
  rows.push(
    ['Shell', info.shell],
    ['Terminal', info.terminal],
    ['User', info.user],
    ['Hostname', info.hostname],
    ['Uptime', info.uptime],
    ['IP', info.ipAddresses.join('\n' + ' '.repeat(16))],
  );
  const body = rows.map(([k, v]) => `${c.cyan(k.padEnd(14))} ${v}`).join('\n');
  return box(body, { title: `${icons.computer} System Information`, color: c.purple });
}

/** Render the project-detection panel. */
export function renderProject(info: ProjectInfo): string {
  if (!info.detected) {
    return box(c.gray('No recognizable project detected in this directory.'), {
      title: `${icons.folder} Project`,
    });
  }
  const lines = [
    `${c.cyan('Languages   ')} ${info.languages.join(', ') || '—'}`,
    `${c.cyan('Frameworks  ')} ${info.frameworks.join(', ') || '—'}`,
    `${c.cyan('Pkg Manager ')} ${info.packageManager ?? '—'}`,
    `${c.cyan('Build Tool  ')} ${info.buildTool ?? '—'}`,
    `${c.cyan('Dependencies')} ${info.dependencies} deps · ${info.devDependencies} dev`,
  ];
  const scriptKeys = Object.keys(info.scripts);
  if (scriptKeys.length) {
    lines.push('');
    lines.push(c.bold('Scripts:'));
    for (const k of scriptKeys.slice(0, 12)) {
      lines.push(`  ${c.green(k.padEnd(14))} ${c.gray(info.scripts[k])}`);
    }
    if (scriptKeys.length > 12) lines.push(c.gray(`  …and ${scriptKeys.length - 12} more`));
  }
  return box(lines.join('\n'), { title: `${icons.folder} Project`, color: c.teal });
}

export { indent };
