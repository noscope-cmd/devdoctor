/**
 * Unit tests for DevDoctor core logic.
 * Run with: node --test (after `npm run build`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseVersion,
  compareVersions,
  computeScore,
  scoreLabel,
  Severity,
  createRegistry,
  buildContext,
  runChecks,
  toJson,
  toYamlReport,
  toMarkdown,
  toHtml,
} from '../dist/index.js';
import { toYaml } from '../dist/utils/yaml.js';
import { parseArgs, resolveFormat } from '../dist/cli/args.js';

test('parseVersion extracts semver from noisy output', () => {
  assert.equal(parseVersion('git version 2.39.3'), '2.39.3');
  assert.equal(parseVersion('v20.11.0'), '20.11.0');
  assert.equal(parseVersion('Python 3.12.1'), '3.12.1');
  assert.equal(parseVersion('no version here'), undefined);
});

test('compareVersions orders correctly', () => {
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.2', '1.10'), -1);
});

test('computeScore weights warnings at half and ignores skipped', () => {
  const results = [
    { id: 'a', title: 'A', severity: Severity.Ok, summary: '' },
    { id: 'b', title: 'B', severity: Severity.Warning, summary: '' },
    { id: 'c', title: 'C', severity: Severity.Error, summary: '' },
    { id: 'd', title: 'D', severity: Severity.Skipped, summary: '' },
  ];
  const score = computeScore(results);
  // scored = a(1) + b(0.5) + c(0) over 3 => 50%
  assert.equal(score.percent, 50);
  assert.equal(score.passed, 1);
  assert.equal(score.warnings, 1);
  assert.equal(score.errors, 1);
  assert.equal(score.skipped, 1);
});

test('scoreLabel buckets', () => {
  assert.equal(scoreLabel(95), 'Excellent');
  assert.equal(scoreLabel(80), 'Good');
  assert.equal(scoreLabel(60), 'Fair');
  assert.equal(scoreLabel(30), 'Needs Attention');
  assert.equal(scoreLabel(10), 'Critical');
});

test('toYaml serializes nested structures', () => {
  const y = toYaml({ a: 1, b: [1, 2], c: { d: 'x' } });
  assert.match(y, /a: 1/);
  assert.match(y, /b:/);
  assert.match(y, /- 1/);
  assert.match(y, /d: x/);
});

test('parseArgs handles commands, flags and values', () => {
  const p = parseArgs(['ports', '--kill', '3000', '-v']);
  assert.equal(p.command, 'ports');
  assert.equal(p.flags.kill, '3000');
  assert.equal(p.flags.verbose, true);
});

test('resolveFormat picks the right format', () => {
  assert.equal(resolveFormat({ json: true }), 'json');
  assert.equal(resolveFormat({ yaml: true }), 'yaml');
  assert.equal(resolveFormat({ format: 'html' }), 'html');
  assert.equal(resolveFormat({}), 'human');
});

test('registry contains all required tool checks', () => {
  const reg = createRegistry();
  const ids = reg.all().map((c) => c.id);
  for (const id of ['git', 'node', 'npm', 'python', 'docker', 'rust', 'go', 'java']) {
    assert.ok(ids.includes(id), `missing check: ${id}`);
  }
});

test('full run produces a valid report and all reporters succeed', async () => {
  const reg = createRegistry();
  const ctx = buildContext({ cwd: process.cwd() });
  const report = await runChecks(reg, ctx, { concurrency: 16 });
  assert.ok(report.groups.length > 0);
  assert.ok(report.score.percent >= 0 && report.score.percent <= 100);
  // Reporters must not throw and must produce non-empty output.
  assert.ok(toJson(report).length > 10);
  assert.ok(toYamlReport(report).length > 10);
  assert.ok(toMarkdown(report).includes('# DevDoctor Report'));
  assert.ok(toHtml(report).includes('<!DOCTYPE html>'));
});

test('full scan completes under 3 seconds', async () => {
  const reg = createRegistry();
  const ctx = buildContext({ cwd: process.cwd() });
  const start = Date.now();
  await runChecks(reg, ctx);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 3000, `scan took ${elapsed}ms`);
});
