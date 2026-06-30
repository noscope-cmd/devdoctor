/**
 * Zero-dependency ANSI styling.
 *
 * Respects `NO_COLOR`, `FORCE_COLOR`, non-TTY stdout, and `--no-color`.
 * @packageDocumentation
 */

let enabled = computeColorEnabled();

function computeColorEnabled(): boolean {
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0') return true;
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.TERM === 'dumb') return false;
  return Boolean(process.stdout.isTTY);
}

/** Force-enable or disable colored output (e.g. for `--no-color`). */
export function setColorEnabled(value: boolean): void {
  enabled = value;
}

/** Whether color is currently active. */
export function colorEnabled(): boolean {
  return enabled;
}

function wrap(open: number, close: number) {
  return (s: string | number): string =>
    enabled ? `\u001b[${open}m${s}\u001b[${close}m` : String(s);
}

function wrap256(code: number) {
  return (s: string | number): string =>
    enabled ? `\u001b[38;5;${code}m${s}\u001b[39m` : String(s);
}

export const c = {
  reset: wrap(0, 0),
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  underline: wrap(4, 24),
  inverse: wrap(7, 27),

  black: wrap(30, 39),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  white: wrap(37, 39),
  gray: wrap(90, 39),

  brightRed: wrap(91, 39),
  brightGreen: wrap(92, 39),
  brightYellow: wrap(93, 39),
  brightBlue: wrap(94, 39),
  brightCyan: wrap(96, 39),

  bgRed: wrap(41, 49),
  bgGreen: wrap(42, 49),
  bgYellow: wrap(43, 49),
  bgBlue: wrap(44, 49),

  orange: wrap256(208),
  teal: wrap256(37),
  purple: wrap256(99),
};

/** Strip ANSI escape codes from a string (for width calculations). */
export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

/** Visible width of a string ignoring ANSI codes. */
export function visibleWidth(s: string): number {
  return stripAnsi(s).length;
}
