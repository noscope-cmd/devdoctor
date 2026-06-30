/**
 * Interactive menu mode using Node's built-in readline (no dependencies).
 * @packageDocumentation
 */

import { createInterface } from 'node:readline';
import { c } from '../ui/colors.js';
import { icons } from '../ui/icons.js';
import { banner } from '../reporters/terminal.js';
import type { ParsedArgs } from './args.js';
import {
  prepare,
  cmdDoctor,
  cmdScan,
  cmdSystem,
  cmdProject,
  cmdGit,
  cmdDocker,
  cmdPorts,
  cmdFix,
} from './commands.js';

const MENU: Array<{ key: string; label: string; run: string }> = [
  { key: '1', label: 'Run full doctor', run: 'doctor' },
  { key: '2', label: 'Complete scan (tools + system + project + git + docker)', run: 'scan' },
  { key: '3', label: 'System information', run: 'system' },
  { key: '4', label: 'Project detection', run: 'project' },
  { key: '5', label: 'Git diagnostics', run: 'git' },
  { key: '6', label: 'Docker diagnostics', run: 'docker' },
  { key: '7', label: 'Port scanner', run: 'ports' },
  { key: '8', label: 'Show issues & fixes', run: 'fix' },
  { key: 'q', label: 'Quit', run: 'quit' },
];

function ask(rl: ReturnType<typeof createInterface>, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve));
}

/** Run the interactive loop. */
export async function runInteractive(args: ParsedArgs): Promise<number> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write(banner() + '\n');

  try {
    while (true) {
      process.stdout.write('\n' + c.bold(c.cyan(`${icons.heart} DevDoctor — Interactive Mode\n`)));
      for (const item of MENU) {
        process.stdout.write(`  ${c.green(item.key)}  ${item.label}\n`);
      }
      const choice = (await ask(rl, c.cyan('\n  Select an option: '))).trim().toLowerCase();
      const item = MENU.find((m) => m.key === choice);
      if (!item || item.run === 'quit') {
        process.stdout.write(c.gray('\n  Goodbye! 👋\n'));
        break;
      }
      const env = await prepare({ ...args, command: item.run, flags: { ...args.flags } });
      process.stdout.write('\n');
      const result = await dispatchInteractive(item.run, env);
      process.stdout.write(result + '\n');
      await ask(rl, c.gray('\n  Press Enter to continue...'));
      process.stdout.write('\x1b[2J\x1b[H');
    }
  } finally {
    rl.close();
  }
  return 0;
}

async function dispatchInteractive(run: string, env: Awaited<ReturnType<typeof prepare>>): Promise<string> {
  switch (run) {
    case 'doctor':
      return (await cmdDoctor(env)).output;
    case 'scan':
      return (await cmdScan(env)).output;
    case 'system':
      return (await cmdSystem(env)).output;
    case 'project':
      return (await cmdProject(env)).output;
    case 'git':
      return (await cmdGit(env)).output;
    case 'docker':
      return (await cmdDocker(env)).output;
    case 'ports':
      return (await cmdPorts(env)).output;
    case 'fix':
      return (await cmdFix(env)).output;
    default:
      return c.red('Unknown option');
  }
}
