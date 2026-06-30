/**
 * Example DevDoctor plugin / config.
 *
 * Copy this file to the root of any project as `devdoctor.config.mjs` (or drop
 * it into `~/.devdoctor/plugins/`) and DevDoctor will auto-load it.
 *
 * This example adds two custom checks:
 *   1. A `deno` runtime check using the `toolCheck` helper.
 *   2. A bespoke check that verifies a `.env` file exists in the project.
 */

import { toolCheck, defineCheck, Severity } from 'devdoctor';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

export default {
  name: 'example-plugin',
  register(registry) {
    // 1) A standard tool check — three lines and you're done.
    registry.add(
      toolCheck({
        id: 'deno',
        title: 'Deno',
        category: 'languages',
        bin: 'deno',
        scored: false,
        install: {
          description: 'Install Deno',
          command: 'curl -fsSL https://deno.land/install.sh | sh',
          url: 'https://deno.land/',
        },
      }),
    );

    // 2) A fully custom check with arbitrary logic.
    registry.add(
      defineCheck({
        id: 'project.env',
        title: '.env file present',
        category: 'project',
        scored: false,
        async run(ctx) {
          try {
            await access(join(ctx.cwd, '.env'));
            return {
              id: 'project.env',
              title: '.env file present',
              severity: Severity.Ok,
              summary: 'Found',
            };
          } catch {
            return {
              id: 'project.env',
              title: '.env file present',
              severity: Severity.Warning,
              summary: 'No .env file in this directory',
              fixes: [{ description: 'Create one from the template', command: 'cp .env.example .env' }],
            };
          }
        },
      }),
    );
  },
};
