/**
 * DevDoctor CLI entry point.
 *
 * Parses arguments, dispatches to a command, prints output, and sets the
 * process exit code (non-zero when critical issues are found).
 *
 * @packageDocumentation
 */

import { parseArgs } from './cli/args.js';
import { setColorEnabled } from './ui/colors.js';
import { helpText } from './cli/help.js';
import { VERSION } from './core/engine.js';
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
  cmdReport,
  cmdUpdate,
  type CommandResult,
} from './cli/commands.js';
import { runInteractive } from './cli/interactive.js';

/** Main entry. Returns the desired process exit code. */
export async function main(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.flags['no-color']) setColorEnabled(false);

  // Top-level flags.
  if (args.flags.help || args.command === 'help') {
    process.stdout.write(helpText());
    return 0;
  }
  if (args.flags.version || args.command === 'version') {
    process.stdout.write(`devdoctor v${VERSION}\n`);
    return 0;
  }
  if (args.flags.interactive || args.command === 'interactive') {
    return runInteractive(args);
  }

  const env = await prepare(args);

  let result: CommandResult;
  switch (args.command) {
    case 'doctor':
    case 'tools':
      result = await cmdDoctor(env);
      break;
    case 'scan':
      result = await cmdScan(env);
      break;
    case 'system':
      result = await cmdSystem(env);
      break;
    case 'project':
      result = await cmdProject(env);
      break;
    case 'git':
      result = await cmdGit(env);
      break;
    case 'docker':
      result = await cmdDocker(env);
      break;
    case 'ports':
      result = await cmdPorts(env);
      break;
    case 'fix':
      result = await cmdFix(env);
      break;
    case 'report':
      result = await cmdReport(env);
      break;
    case 'update':
      result = await cmdUpdate(env);
      break;
    default:
      process.stderr.write(`Unknown command: ${args.command}\n\n`);
      process.stdout.write(helpText());
      return 2;
  }

  process.stdout.write(result.output + '\n');
  return result.code;
}

// Execute when run directly.
main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    process.stderr.write(`devdoctor: fatal error: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exitCode = 1;
  });
