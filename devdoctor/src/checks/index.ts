/**
 * Aggregates all built-in checks into a ready-to-use {@link CheckRegistry}.
 * @packageDocumentation
 */

import { CheckRegistry } from '../core/registry.js';
import { vcsChecks } from './vcs.js';
import { languageChecks } from './languages.js';
import { packageManagerChecks } from './package-managers.js';
import { containerChecks } from './containers.js';
import { cloudChecks } from './cloud.js';
import { databaseChecks } from './databases.js';

/** Build a registry preloaded with every built-in check. */
export function createRegistry(): CheckRegistry {
  const registry = new CheckRegistry();
  registry.add(
    ...vcsChecks,
    ...languageChecks,
    ...packageManagerChecks,
    ...containerChecks,
    ...cloudChecks,
    ...databaseChecks,
  );
  return registry;
}
