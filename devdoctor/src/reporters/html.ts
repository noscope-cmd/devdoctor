/**
 * Self-contained HTML report generator (inline CSS, no external assets).
 * @packageDocumentation
 */

import { Severity, type DiagnosticReport } from '../core/types.js';

const SEV: Record<Severity, { icon: string; color: string; label: string }> = {
  [Severity.Ok]: { icon: '✅', color: '#22c55e', label: 'Healthy' },
  [Severity.Warning]: { icon: '⚠️', color: '#eab308', label: 'Warning' },
  [Severity.Error]: { icon: '❌', color: '#ef4444', label: 'Error' },
  [Severity.Skipped]: { icon: '➖', color: '#6b7280', label: 'Skipped' },
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Generate a standalone HTML report. */
export function toHtml(report: DiagnosticReport): string {
  const s = report.score;
  const scoreColor = s.percent >= 85 ? '#22c55e' : s.percent >= 60 ? '#eab308' : '#ef4444';

  const groupsHtml = report.groups
    .map((g) => {
      const rows = g.results
        .map((r) => {
          const sev = SEV[r.severity];
          const fixes = (r.fixes ?? [])
            .map(
              (f) =>
                `<div class="fix">🔧 ${esc(f.description)}${
                  f.command ? `<pre>$ ${esc(f.command)}</pre>` : ''
                }${f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noreferrer">docs ↗</a>` : ''}</div>`,
            )
            .join('');
          return `<tr>
            <td class="sev" style="color:${sev.color}">${sev.icon}</td>
            <td class="title">${esc(r.title)}</td>
            <td>${esc(r.summary)}</td>
            <td class="ver">${esc(r.version ?? '')}</td>
          </tr>${
            r.detail || fixes
              ? `<tr class="detail"><td></td><td colspan="3">${
                  r.detail ? `<p>${esc(r.detail)}</p>` : ''
                }${fixes}</td></tr>`
              : ''
          }`;
        })
        .join('');
      return `<section><h2>${esc(g.label)}</h2><table>${rows}</table></section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DevDoctor Report</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
         background:#0b1020; color:#e5e7eb; line-height:1.5; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  header { text-align:center; padding: 2rem 0; }
  h1 { font-size: 2.2rem; margin:0; background: linear-gradient(90deg,#38bdf8,#818cf8);
       -webkit-background-clip:text; background-clip:text; color:transparent; }
  .meta { color:#94a3b8; font-size:.85rem; margin-top:.5rem; }
  .score-card { background:#111729; border:1px solid #1f2937; border-radius:16px;
                padding:1.5rem; margin:1.5rem 0; }
  .bar { height:18px; background:#1f2937; border-radius:99px; overflow:hidden; margin:.75rem 0; }
  .bar > span { display:block; height:100%; border-radius:99px; }
  .score-num { font-size:2.6rem; font-weight:800; }
  .pills { display:flex; gap:.75rem; flex-wrap:wrap; margin-top:1rem; }
  .pill { background:#0b1020; border:1px solid #1f2937; border-radius:99px; padding:.3rem .9rem; font-size:.85rem; }
  section { background:#111729; border:1px solid #1f2937; border-radius:14px; padding:1rem 1.25rem; margin:1rem 0; }
  h2 { font-size:1.1rem; margin:.25rem 0 .75rem; color:#7dd3fc; }
  table { width:100%; border-collapse:collapse; }
  td { padding:.45rem .5rem; border-bottom:1px solid #1a2233; vertical-align:top; font-size:.92rem; }
  td.sev { width:2rem; text-align:center; font-size:1.05rem; }
  td.title { font-weight:600; width:14rem; }
  td.ver { color:#94a3b8; text-align:right; white-space:nowrap; }
  tr.detail td { color:#94a3b8; font-size:.85rem; padding-top:0; border-bottom:1px solid #1a2233; }
  .fix { margin:.4rem 0; }
  .fix pre { background:#0b1020; border:1px solid #1f2937; border-radius:8px; padding:.5rem .7rem;
             overflow:auto; margin:.3rem 0; color:#7dd3fc; font-size:.82rem; }
  .fix a { color:#818cf8; font-size:.8rem; }
  footer { text-align:center; color:#475569; font-size:.8rem; margin-top:2rem; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>🩺 DevDoctor Report</h1>
      <div class="meta">${esc(report.platform.osName)} · ${esc(report.platform.arch)} · ${esc(report.generatedAt)}</div>
    </header>
    <div class="score-card">
      <div style="display:flex;align-items:baseline;justify-content:space-between">
        <div><div class="score-num" style="color:${scoreColor}">${s.percent}%</div>
        <div style="color:${scoreColor};font-weight:700">${esc(s.label)}</div></div>
        <div style="text-align:right;color:#94a3b8">Development Environment</div>
      </div>
      <div class="bar"><span style="width:${s.percent}%;background:${scoreColor}"></span></div>
      <div class="pills">
        <div class="pill">✅ ${s.passed} passed</div>
        <div class="pill">⚠️ ${s.warnings} warning${s.warnings === 1 ? '' : 's'}</div>
        <div class="pill">❌ ${s.errors} critical</div>
        ${s.skipped ? `<div class="pill">➖ ${s.skipped} skipped</div>` : ''}
      </div>
    </div>
    ${groupsHtml}
    <footer>Generated by DevDoctor v${esc(report.version)}</footer>
  </div>
</body>
</html>`;
}
