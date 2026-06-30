/**
 * Deep Docker diagnostics: daemon, compose, containers, images, volumes, disk.
 * @packageDocumentation
 */

import { Severity, type CheckContext, type CheckResult, type PlatformInfo } from '../core/types.js';

/** Platform-appropriate command to start the Docker daemon. */
export function startCommandForDocker(platform: PlatformInfo): string {
  if (platform.isMac) return 'open -a Docker';
  if (platform.isWindows) return 'Start Docker Desktop from the Start menu';
  return 'sudo systemctl start docker';
}

/** Run the full Docker diagnostic suite. */
export async function dockerDiagnostics(ctx: CheckContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const dockerPath = await ctx.run.which('docker');

  if (!dockerPath) {
    results.push({
      id: 'docker.installed',
      title: 'Docker installed',
      severity: Severity.Error,
      summary: 'Docker not found',
      fixes: [
        {
          description: 'Install Docker',
          url: 'https://docs.docker.com/get-docker/',
        },
      ],
    });
    return results;
  }

  const ver = await ctx.run('docker', ['version', '--format', '{{.Client.Version}}']);
  results.push({
    id: 'docker.installed',
    title: 'Docker installed',
    severity: Severity.Ok,
    summary: `v${ver.stdout.trim() || '?'}`,
    path: dockerPath,
  });

  // Daemon
  const info = await ctx.run('docker', ['info', '--format', '{{json .}}'], { timeoutMs: 6000 });
  if (!info.ok) {
    results.push({
      id: 'docker.daemon',
      title: 'Docker daemon running',
      severity: Severity.Error,
      summary: 'Daemon not running',
      detail: 'Docker daemon is not running.',
      fixes: [{ description: 'Start the Docker daemon', command: startCommandForDocker(ctx.platform) }],
    });
    return results; // No point querying further.
  }

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(info.stdout);
  } catch {
    /* ignore */
  }
  results.push({
    id: 'docker.daemon',
    title: 'Docker daemon running',
    severity: Severity.Ok,
    summary: `Server v${(parsed.ServerVersion as string) ?? '?'}`,
    meta: { containers: parsed.Containers, images: parsed.Images },
  });

  // Compose
  const compose = await ctx.run('docker', ['compose', 'version']);
  results.push({
    id: 'docker.compose',
    title: 'Docker Compose',
    severity: compose.ok ? Severity.Ok : Severity.Warning,
    scored: false,
    summary: compose.ok ? compose.stdout.trim().split('\n')[0] : 'Not available',
  });

  // Running containers
  const ps = await ctx.run('docker', ['ps', '--format', '{{.Names}}\t{{.Image}}\t{{.Status}}']);
  const containers = ps.stdout.trim() ? ps.stdout.trim().split('\n') : [];
  results.push({
    id: 'docker.containers',
    title: 'Running containers',
    severity: Severity.Ok,
    scored: false,
    summary: containers.length ? `${containers.length} running` : 'None running',
    meta: { containers },
  });

  // Images
  const images = await ctx.run('docker', ['images', '-q']);
  const imageCount = images.stdout.trim() ? images.stdout.trim().split('\n').length : 0;
  results.push({
    id: 'docker.images',
    title: 'Images',
    severity: Severity.Ok,
    scored: false,
    summary: `${imageCount} image${imageCount === 1 ? '' : 's'}`,
  });

  // Volumes
  const volumes = await ctx.run('docker', ['volume', 'ls', '-q']);
  const volCount = volumes.stdout.trim() ? volumes.stdout.trim().split('\n').length : 0;
  results.push({
    id: 'docker.volumes',
    title: 'Volumes',
    severity: Severity.Ok,
    scored: false,
    summary: `${volCount} volume${volCount === 1 ? '' : 's'}`,
  });

  // Disk usage
  const df = await ctx.run('docker', ['system', 'df', '--format', '{{.Type}}: {{.Size}} ({{.Reclaimable}} reclaimable)']);
  if (df.ok && df.stdout.trim()) {
    results.push({
      id: 'docker.disk',
      title: 'Disk usage',
      severity: Severity.Ok,
      scored: false,
      summary: df.stdout.trim().split('\n').join(' · '),
    });
  }

  return results;
}
