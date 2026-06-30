/**
 * Helpers for defining checks with minimal boilerplate.
 *
 * The {@link toolCheck} factory captures the very common pattern of
 * "is this CLI installed, what version, is it usable" so that adding a new
 * tool is typically a 5-line definition.
 *
 * @packageDocumentation
 */

import {
  type Check,
  type CheckCategory,
  type CheckContext,
  type CheckResult,
  type SuggestedFix,
  Severity,
} from './types.js';
import { parseVersion } from '../utils/exec.js';

/** Define a check from a plain object (identity helper for typing). */
export function defineCheck(check: Check): Check {
  return check;
}

/** Configuration for the {@link toolCheck} factory. */
export interface ToolCheckConfig {
  /** Stable id, e.g. `node`. */
  id: string;
  /** Display title, e.g. `Node.js`. */
  title: string;
  /** Category for grouping. */
  category: CheckCategory;
  /** Executable name (or list of candidates) to look for on PATH. */
  bin: string | readonly string[];
  /** Arguments that print the version. Default `['--version']`. */
  versionArgs?: readonly string[];
  /** Optional minimum recommended version; warns if older. */
  minVersion?: string;
  /** Tags for filtering. */
  tags?: readonly string[];
  /** Install hint shown when the tool is missing. */
  install?: SuggestedFix;
  /** Whether this counts toward score. Default true. */
  scored?: boolean;
  /** Extra per-tool validation run after version detection. */
  extra?: (
    ctx: CheckContext,
    found: { bin: string; path: string; version?: string; raw: string },
  ) => Promise<Partial<CheckResult> | void> | Partial<CheckResult> | void;
}

/**
 * Build a standard CLI-tool check.
 *
 * Resolves the binary on PATH, runs the version command, optionally compares
 * against a minimum version, and merges any extra validation result.
 */
export function toolCheck(cfg: ToolCheckConfig): Check {
  const bins = Array.isArray(cfg.bin) ? cfg.bin : [cfg.bin];
  const versionArgs = cfg.versionArgs ?? ['--version'];

  return {
    id: cfg.id,
    title: cfg.title,
    category: cfg.category,
    tags: cfg.tags,
    scored: cfg.scored ?? true,
    async run(ctx): Promise<CheckResult> {
      const start = Date.now();

      // Resolve the first available binary.
      let resolved: { bin: string; path: string } | null = null;
      for (const b of bins) {
        const p = await ctx.run.which(b);
        if (p) {
          resolved = { bin: b, path: p };
          break;
        }
      }

      if (!resolved) {
        // Optional tools (scored: false) are reported as a soft "not installed"
        // skip so they don't inflate the critical-issue count, while required
        // tools surface as hard errors.
        const optional = (cfg.scored ?? true) === false;
        return {
          id: cfg.id,
          title: cfg.title,
          severity: optional ? Severity.Skipped : Severity.Error,
          summary: optional ? 'Not installed (optional)' : 'Not installed',
          detail: `\`${bins[0]}\` was not found on your PATH.`,
          fixes: cfg.install ? [cfg.install] : undefined,
          durationMs: Date.now() - start,
          scored: cfg.scored ?? true,
        };
      }

      // Run the *resolved absolute path* (not the bare name). On Windows this
      // is essential: it carries the real extension (e.g. `npm.cmd`) so the
      // runner can route batch shims through cmd.exe instead of failing.
      const res = await ctx.run(resolved.path, versionArgs);
      const raw = (res.stdout || res.stderr).trim();
      const version = parseVersion(raw);

      let severity = Severity.Ok;
      let summary = version ? `v${version}` : 'Installed';
      const fixes: SuggestedFix[] = [];
      let detail: string | undefined;

      if (!res.ok && !version) {
        severity = Severity.Warning;
        summary = 'Installed but version check failed';
        detail = res.stderr.trim() || raw;
      }

      if (cfg.minVersion && version) {
        const { compareVersions } = await import('../utils/exec.js');
        if (compareVersions(version, cfg.minVersion) < 0) {
          severity = Severity.Warning;
          summary = `v${version} (outdated)`;
          detail = `Recommended minimum is v${cfg.minVersion}.`;
          fixes.push({
            description: `Upgrade ${cfg.title} to v${cfg.minVersion}+`,
            command: cfg.install?.command,
            url: cfg.install?.url,
          });
        }
      }

      let base: CheckResult = {
        id: cfg.id,
        title: cfg.title,
        severity,
        summary,
        version,
        path: resolved.path,
        detail,
        fixes: fixes.length ? fixes : undefined,
        scored: cfg.scored ?? true,
      };

      if (cfg.extra) {
        const patch = await cfg.extra(ctx, { ...resolved, version, raw });
        if (patch) {
          base = {
            ...base,
            ...patch,
            fixes: mergeFixes(base.fixes, patch.fixes),
            meta: { ...base.meta, ...patch.meta },
          };
        }
      }

      return { ...base, durationMs: Date.now() - start };
    },
  };
}

function mergeFixes(
  a?: readonly SuggestedFix[],
  b?: readonly SuggestedFix[],
): readonly SuggestedFix[] | undefined {
  const merged = [...(a ?? []), ...(b ?? [])];
  return merged.length ? merged : undefined;
}
