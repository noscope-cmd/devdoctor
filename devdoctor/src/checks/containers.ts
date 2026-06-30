/**
 * Container checks: Docker (+ daemon), Docker Compose.
 * Deeper diagnostics live in checks/docker-diagnostics.ts.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import { Severity, type Check, type SuggestedFix } from '../core/types.js';
import { startCommandForDocker } from './docker-diagnostics.js';

export const containerChecks: Check[] = [
  toolCheck({
    id: 'docker',
    title: 'Docker',
    category: 'containers',
    bin: 'docker',
    versionArgs: ['--version'],
    tags: ['container'],
    install: {
      description: 'Install Docker',
      command: 'brew install --cask docker',
      url: 'https://docs.docker.com/get-docker/',
    },
    extra: async (ctx, found) => {
      // Verify the daemon is reachable.
      const info = await ctx.run('docker', ['info', '--format', '{{.ServerVersion}}'], {
        timeoutMs: 5000,
      });
      if (!info.ok) {
        const fixes: SuggestedFix[] = [
          {
            description: 'Start the Docker daemon',
            command: startCommandForDocker(ctx.platform),
          },
        ];
        return {
          severity: Severity.Error,
          summary: `v${found.version ?? '?'} (daemon not running)`,
          detail: 'Docker CLI is installed but the daemon is not responding.',
          fixes,
          meta: { daemonRunning: false },
        };
      }
      return {
        summary: `v${found.version ?? '?'} (daemon running)`,
        meta: { daemonRunning: true, serverVersion: info.stdout.trim() },
      };
    },
  }),
  toolCheck({
    id: 'docker-compose',
    title: 'Docker Compose',
    category: 'containers',
    bin: 'docker',
    versionArgs: ['compose', 'version'],
    scored: false,
    tags: ['container', 'compose'],
    install: {
      description: 'Docker Compose ships with modern Docker Desktop / engine',
      url: 'https://docs.docker.com/compose/install/',
    },
  }),
];
