/**
 * Central registry of all diagnostic checks plus category metadata.
 * Plugins append to this registry; nothing else needs to change.
 * @packageDocumentation
 */

import type { Check, CheckCategory } from './types.js';

/** Human-friendly labels for each category. */
export const CATEGORY_LABELS: Record<CheckCategory, string> = {
  vcs: 'Version Control',
  languages: 'Languages & Runtimes',
  'package-managers': 'Package Managers',
  cloud: 'Cloud & Infrastructure',
  containers: 'Containers',
  databases: 'Databases',
  system: 'System',
  project: 'Project',
  custom: 'Plugins',
};

/** Display order for categories. */
export const CATEGORY_ORDER: readonly CheckCategory[] = [
  'vcs',
  'languages',
  'package-managers',
  'containers',
  'cloud',
  'databases',
  'project',
  'system',
  'custom',
];

/** A mutable registry of checks. */
export class CheckRegistry {
  private readonly checks = new Map<string, Check>();

  /** Register one or more checks. Later registrations override by id. */
  add(...checks: Check[]): this {
    for (const ch of checks) this.checks.set(ch.id, ch);
    return this;
  }

  /** All registered checks. */
  all(): Check[] {
    return [...this.checks.values()];
  }

  /** Checks filtered by category. */
  byCategory(cat: CheckCategory): Check[] {
    return this.all().filter((c) => c.category === cat);
  }

  /** Look up a single check by id. */
  get(id: string): Check | undefined {
    return this.checks.get(id);
  }

  /** Filter checks by a tag or id substring. */
  filter(query: string): Check[] {
    const q = query.toLowerCase();
    return this.all().filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }
}
