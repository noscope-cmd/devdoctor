/**
 * Deep Git diagnostics: identity, SSH keys, GitHub auth, repo status.
 * @packageDocumentation
 */

import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Severity, type CheckContext, type CheckResult } from '../core/types.js';
import { parseVersion } from '../utils/exec.js';

/** Run the full Git diagnostic suite, returning granular results. */
export async function gitDiagnostics(ctx: CheckContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const gitPath = await ctx.run.which('git');

  if (!gitPath) {
    results.push({
      id: 'git.installed',
      title: 'Git installed',
      severity: Severity.Error,
      summary: 'Git not found',
      fixes: [{ description: 'Install Git', url: 'https://git-scm.com/downloads' }],
    });
    return results;
  }

  const ver = await ctx.run('git', ['--version']);
  results.push({
    id: 'git.installed',
    title: 'Git installed',
    severity: Severity.Ok,
    summary: `v${parseVersion(ver.stdout) ?? '?'}`,
    path: gitPath,
  });

  // Identity
  const name = (await ctx.run('git', ['config', '--global', 'user.name'])).stdout.trim();
  const email = (await ctx.run('git', ['config', '--global', 'user.email'])).stdout.trim();
  results.push({
    id: 'git.user',
    title: 'User name configured',
    severity: name ? Severity.Ok : Severity.Warning,
    summary: name || 'Not set',
    fixes: name
      ? undefined
      : [{ description: 'Set author name', command: 'git config --global user.name "Your Name"' }],
  });
  results.push({
    id: 'git.email',
    title: 'Email configured',
    severity: email ? Severity.Ok : Severity.Warning,
    summary: email || 'Not set',
    fixes: email
      ? undefined
      : [{ description: 'Set email', command: 'git config --global user.email "you@example.com"' }],
  });

  // SSH keys
  const sshKeys = await findSshKeys();
  results.push({
    id: 'git.ssh',
    title: 'SSH keys present',
    severity: sshKeys.length ? Severity.Ok : Severity.Warning,
    summary: sshKeys.length ? sshKeys.join(', ') : 'No SSH keys found in ~/.ssh',
    fixes: sshKeys.length
      ? undefined
      : [
          {
            description: 'Generate an SSH key',
            command: 'ssh-keygen -t ed25519 -C "you@example.com"',
            url: 'https://docs.github.com/authentication/connecting-to-github-with-ssh',
          },
        ],
  });

  // GitHub authentication (gh CLI or ssh -T)
  const gh = await ctx.run.which('gh');
  if (gh) {
    const status = await ctx.run('gh', ['auth', 'status'], { timeoutMs: 6000 });
    const authed = status.ok || /Logged in to/i.test(status.stdout + status.stderr);
    results.push({
      id: 'git.github',
      title: 'GitHub authentication',
      severity: authed ? Severity.Ok : Severity.Warning,
      summary: authed ? 'Authenticated (gh)' : 'Not authenticated',
      scored: false,
      fixes: authed ? undefined : [{ description: 'Log in to GitHub', command: 'gh auth login' }],
    });
  } else {
    results.push({
      id: 'git.github',
      title: 'GitHub authentication',
      severity: Severity.Skipped,
      summary: 'gh CLI not installed (skipped)',
      scored: false,
    });
  }

  // Repository status (only if inside a repo)
  const inside = await ctx.run('git', ['rev-parse', '--is-inside-work-tree']);
  if (inside.stdout.trim() === 'true') {
    const branch = (await ctx.run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim();
    const status = await ctx.run('git', ['status', '--porcelain']);
    const dirtyCount = status.stdout.trim() ? status.stdout.trim().split('\n').length : 0;
    const detached = branch === 'HEAD';

    results.push({
      id: 'git.repo',
      title: 'Current repository',
      severity: detached ? Severity.Warning : Severity.Ok,
      summary: detached
        ? 'Detached HEAD'
        : `On branch ${branch}${dirtyCount ? ` · ${dirtyCount} uncommitted` : ' · clean'}`,
      scored: false,
      meta: { branch, dirtyCount, detached },
      detail: detached
        ? 'You are in a detached HEAD state. Create a branch to keep your work.'
        : undefined,
      fixes: detached
        ? [{ description: 'Create a branch from current state', command: 'git switch -c my-branch' }]
        : undefined,
    });
  } else {
    results.push({
      id: 'git.repo',
      title: 'Current repository',
      severity: Severity.Skipped,
      summary: 'Not inside a Git repository',
      scored: false,
    });
  }

  return results;
}

/** Find public SSH keys in ~/.ssh. */
async function findSshKeys(): Promise<string[]> {
  try {
    const dir = join(homedir(), '.ssh');
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.pub'));
  } catch {
    return [];
  }
}
