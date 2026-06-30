/**
 * Tiny zero-dependency argument parser tailored to DevDoctor's CLI.
 * @packageDocumentation
 */

/** Parsed CLI arguments. */
export interface ParsedArgs {
  command: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/** Output format selection. */
export type Format = 'human' | 'json' | 'yaml' | 'markdown' | 'html';

const ALIASES: Record<string, string> = {
  v: 'verbose',
  q: 'quiet',
  h: 'help',
  V: 'version',
  o: 'output',
  f: 'format',
};

/** Parse argv (excluding `node` and script path). */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const body = arg.slice(2);
      const eq = body.indexOf('=');
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('-') && expectsValue(body)) {
          flags[body] = next;
          i++;
        } else {
          flags[body] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const letters = arg.slice(1).split('');
      for (let j = 0; j < letters.length; j++) {
        const name = ALIASES[letters[j]] ?? letters[j];
        const next = argv[i + 1];
        if (j === letters.length - 1 && next && !next.startsWith('-') && expectsValue(name)) {
          flags[name] = next;
          i++;
        } else {
          flags[name] = true;
        }
      }
    } else {
      positionals.push(arg);
    }
  }

  const command = positionals.shift() ?? 'doctor';
  return { command, positionals, flags };
}

function expectsValue(name: string): boolean {
  return ['output', 'format', 'kill', 'plugin', 'only', 'concurrency'].includes(name);
}

/** Resolve the requested output format from flags. */
export function resolveFormat(flags: Record<string, string | boolean>): Format {
  if (flags.json) return 'json';
  if (flags.yaml) return 'yaml';
  if (flags.markdown || flags.md) return 'markdown';
  if (flags.html) return 'html';
  const f = flags.format;
  if (typeof f === 'string') {
    if (['human', 'json', 'yaml', 'markdown', 'html'].includes(f)) return f as Format;
  }
  return 'human';
}
