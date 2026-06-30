/**
 * Version control check: Git, plus configuration sanity.
 * Deeper Git diagnostics live in checks/git-diagnostics.ts.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import { Severity, type Check, type SuggestedFix } from '../core/types.js';

export const vcsChecks: Check[] = [
  toolCheck({
    id: 'git',
    title: 'Git',
    category: 'vcs',
    bin: 'git',
    versionArgs: ['--version'],
    minVersion: '2.20.0',
    tags: ['scm', 'version-control'],
    install: {
      description: 'Install Git',
      command: 'brew install git  # or: apt install git',
      url: 'https://git-scm.com/downloads',
    },
    extra: async (ctx) => {
      const fixes: SuggestedFix[] = [];
      const name = (await ctx.run('git', ['config', '--global', 'user.name'])).stdout.trim();
      const email = (await ctx.run('git', ['config', '--global', 'user.email'])).stdout.trim();
      if (!name) {
        fixes.push({
          description: 'Set your global Git author name',
          command: 'git config --global user.name "Your Name"',
        });
      }
      if (!email) {
        fixes.push({
          description: 'Set your global Git email',
          command: 'git config --global user.email "you@example.com"',
        });
      }
      if (fixes.length) {
        return {
          severity: Severity.Warning,
          summary: 'Installed (identity not configured)',
          detail: 'Git is installed but user.name/user.email are not fully set.',
          fixes,
          meta: { userName: name || null, userEmail: email || null },
        };
      }
      return { meta: { userName: name, userEmail: email } };
    },
  }),
];
