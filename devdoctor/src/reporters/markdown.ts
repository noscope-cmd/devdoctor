/**
 * Markdown report generator.
 * @packageDocumentation
 */

import { Severity, type DiagnosticReport } from '../core/types.js';

const SEV_EMOJI: Record<Severity, string> = {
  [Severity.Ok]: '✅',
  [Severity.Warning]: '⚠️',
  [Severity.Error]: '❌',
  [Severity.Skipped]: '➖',
};

/** Generate a Markdown report from a {@link DiagnosticReport}. */
export function toMarkdown(report: DiagnosticReport): string {
  const out: string[] = [];
  out.push(`# DevDoctor Report`);
  out.push('');
  out.push(`> Generated ${report.generatedAt} · DevDoctor v${report.version}`);
  out.push('');
  out.push(`**Platform:** ${report.platform.osName} (${report.platform.arch})`);
  out.push('');

  // Score
  const s = report.score;
  out.push(`## Health Score: ${s.percent}% — ${s.label}`);
  out.push('');
  const filled = Math.round(s.percent / 5);
  out.push('`' + '█'.repeat(filled) + '░'.repeat(20 - filled) + `` + '` ' + `${s.percent}%`);
  out.push('');
  out.push(`- ✅ ${s.passed} passed`);
  out.push(`- ⚠️ ${s.warnings} warnings`);
  out.push(`- ❌ ${s.errors} critical issues`);
  if (s.skipped) out.push(`- ➖ ${s.skipped} skipped`);
  out.push('');

  for (const group of report.groups) {
    out.push(`## ${group.label}`);
    out.push('');
    out.push('| Status | Tool | Result | Version |');
    out.push('| :----: | ---- | ------ | ------- |');
    for (const r of group.results) {
      out.push(
        `| ${SEV_EMOJI[r.severity]} | ${r.title} | ${escape(r.summary)} | ${r.version ?? ''} |`,
      );
    }
    out.push('');
  }

  // Suggested fixes
  const fixes = report.groups
    .flatMap((g) => g.results)
    .filter((r) => r.fixes && r.fixes.length && r.severity !== Severity.Ok);
  if (fixes.length) {
    out.push('## Suggested Fixes');
    out.push('');
    for (const r of fixes) {
      out.push(`### ${SEV_EMOJI[r.severity]} ${r.title}`);
      if (r.detail) out.push(`${r.detail}`);
      for (const fix of r.fixes ?? []) {
        out.push(`- ${fix.description}`);
        if (fix.command) out.push('  ```sh\n  ' + fix.command + '\n  ```');
        if (fix.url) out.push(`  - Docs: ${fix.url}`);
      }
      out.push('');
    }
  }

  return out.join('\n');
}

function escape(s: string): string {
  return s.replace(/\|/g, '\\|');
}
