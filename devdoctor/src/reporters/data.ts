/**
 * Data reporters: JSON and YAML.
 * @packageDocumentation
 */

import type { DiagnosticReport } from '../core/types.js';
import { toYaml } from '../utils/yaml.js';

/** Strip ANSI-bearing/transient fields and return a clean serializable object. */
export function toPlainObject(report: DiagnosticReport): Record<string, unknown> {
  return {
    generatedAt: report.generatedAt,
    version: report.version,
    platform: report.platform,
    score: report.score,
    groups: report.groups.map((g) => ({
      category: g.category,
      label: g.label,
      results: g.results.map((r) => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        summary: r.summary,
        version: r.version ?? null,
        path: r.path ?? null,
        detail: r.detail ?? null,
        durationMs: r.durationMs ?? null,
        fixes: r.fixes ?? [],
        meta: r.meta ?? {},
      })),
    })),
    sections: report.sections ?? {},
  };
}

/** Serialize the report to pretty JSON. */
export function toJson(report: DiagnosticReport): string {
  return JSON.stringify(toPlainObject(report), null, 2);
}

/** Serialize the report to YAML. */
export function toYamlReport(report: DiagnosticReport): string {
  return toYaml(toPlainObject(report));
}
