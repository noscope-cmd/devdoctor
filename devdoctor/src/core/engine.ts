/**
 * The diagnostic engine.
 *
 * Runs checks concurrently (bounded), groups results by category, and
 * computes the overall health score. Designed to finish a full scan in
 * well under 3 seconds by parallelizing all I/O-bound checks.
 *
 * @packageDocumentation
 */

import {
  type Check,
  type CheckContext,
  type CheckGroupResult,
  type CheckResult,
  type DiagnosticReport,
  type HealthScore,
  type PlatformInfo,
  SEVERITY_WEIGHT,
  Severity,
} from './types.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, type CheckRegistry } from './registry.js';
import { createRunner } from '../utils/exec.js';
import { detectPlatform } from './platform.js';

/** Options for an engine run. */
export interface RunConfig {
  cwd?: string;
  verbose?: boolean;
  /** Max concurrent checks. Default 16. */
  concurrency?: number;
  /** Optional filter: only run checks whose id/tag matches. */
  only?: string[];
  /** Progress callback invoked as each check completes. */
  onProgress?: (done: number, total: number, result: CheckResult) => void;
}

const VERSION = '1.0.0';

/** Run a bounded-concurrency map over an array. */
async function pMap<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Execute a single check, capturing any thrown error as an Error result. */
async function runOne(check: Check, ctx: CheckContext): Promise<CheckResult> {
  const start = Date.now();
  try {
    const r = await check.run(ctx);
    return { ...r, durationMs: r.durationMs ?? Date.now() - start };
  } catch (err) {
    return {
      id: check.id,
      title: check.title,
      severity: Severity.Error,
      summary: 'Check failed unexpectedly',
      detail: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      scored: check.scored ?? true,
    };
  }
}

/** Build the {@link CheckContext} for a run. */
export function buildContext(cfg: RunConfig = {}): CheckContext {
  const platform: PlatformInfo = detectPlatform();
  return {
    cwd: cfg.cwd ?? process.cwd(),
    platform,
    verbose: cfg.verbose ?? false,
    run: createRunner(),
  };
}

/** Run all registered checks and assemble a {@link DiagnosticReport}. */
export async function runChecks(
  registry: CheckRegistry,
  ctx: CheckContext,
  cfg: RunConfig = {},
): Promise<DiagnosticReport> {
  let checks = registry.all();
  if (cfg.only && cfg.only.length) {
    const set = new Set(cfg.only.flatMap((q) => registry.filter(q).map((c) => c.id)));
    checks = checks.filter((c) => set.has(c.id));
  }

  const total = checks.length;
  let done = 0;
  const results = await pMap(
    checks,
    async (check) => {
      const r = await runOne(check, ctx);
      done++;
      cfg.onProgress?.(done, total, r);
      return r;
    },
    cfg.concurrency ?? 16,
  );

  const groups = groupResults(checks, results);
  const score = computeScore(results);

  return {
    generatedAt: new Date().toISOString(),
    version: VERSION,
    platform: ctx.platform,
    groups,
    score,
  };
}

/** Group check results by category in display order. */
export function groupResults(checks: Check[], results: CheckResult[]): CheckGroupResult[] {
  const byId = new Map(checks.map((c) => [c.id, c]));
  const buckets = new Map<string, CheckResult[]>();
  for (const r of results) {
    const cat = byId.get(r.id)?.category ?? 'custom';
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(r);
  }
  const groups: CheckGroupResult[] = [];
  for (const cat of CATEGORY_ORDER) {
    const bucket = buckets.get(cat);
    if (bucket && bucket.length) {
      groups.push({
        category: cat,
        label: CATEGORY_LABELS[cat],
        results: bucket.sort((a, b) => a.title.localeCompare(b.title)),
      });
    }
  }
  return groups;
}

/** Compute the weighted health score across all scored results. */
export function computeScore(results: readonly CheckResult[]): HealthScore {
  const scored = results.filter((r) => (r.scored ?? true) && r.severity !== Severity.Skipped);
  let passed = 0,
    warnings = 0,
    errors = 0,
    skipped = 0;
  let weight = 0;
  for (const r of results) {
    if (r.severity === Severity.Ok) passed++;
    else if (r.severity === Severity.Warning) warnings++;
    else if (r.severity === Severity.Error) errors++;
    else skipped++;
  }
  for (const r of scored) weight += SEVERITY_WEIGHT[r.severity];
  const percent = scored.length === 0 ? 100 : Math.round((weight / scored.length) * 100);

  return {
    percent,
    label: scoreLabel(percent),
    passed,
    warnings,
    errors,
    skipped,
    total: results.length,
  };
}

/** Qualitative label for a score percent. */
export function scoreLabel(percent: number): string {
  if (percent >= 90) return 'Excellent';
  if (percent >= 75) return 'Good';
  if (percent >= 50) return 'Fair';
  if (percent >= 25) return 'Needs Attention';
  return 'Critical';
}

export { VERSION };
