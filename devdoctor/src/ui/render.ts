/**
 * Terminal rendering primitives: tables, progress bars, spinners, boxes.
 * All zero-dependency and ANSI-aware.
 * @packageDocumentation
 */

import { c, visibleWidth } from './colors.js';
import { icons } from './icons.js';

/** Render a simple aligned table given headers and rows of cells. */
export function table(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  opts: { gap?: number } = {},
): string {
  const gap = opts.gap ?? 2;
  const cols = headers.length;
  const widths = new Array(cols).fill(0);
  const all = [headers, ...rows];
  for (const row of all) {
    for (let i = 0; i < cols; i++) {
      widths[i] = Math.max(widths[i], visibleWidth(row[i] ?? ''));
    }
  }
  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - visibleWidth(s)));
  const sep = ' '.repeat(gap);

  const headerLine = headers.map((h, i) => c.bold(pad(h, widths[i]))).join(sep);
  const underline = widths.map((w) => c.gray('─'.repeat(w))).join(sep);
  const body = rows
    .map((row) => row.map((cell, i) => pad(cell ?? '', widths[i])).join(sep))
    .join('\n');
  return `${headerLine}\n${underline}\n${body}`;
}

/** A horizontal progress bar like `██████████░░░░░░░░ 82%`. */
export function progressBar(percent: number, width = 24): string {
  const p = Math.max(0, Math.min(100, percent));
  const filled = Math.round((p / 100) * width);
  const empty = width - filled;
  const color = p >= 85 ? c.brightGreen : p >= 60 ? c.yellow : c.brightRed;
  const bar = color(icons.blockFull.repeat(filled)) + c.gray(icons.blockEmpty.repeat(empty));
  return `${bar} ${c.bold(`${p}%`)}`;
}

/** A section header with an icon. */
export function sectionHeader(title: string, icon = icons.bullet): string {
  return `\n${icon}  ${c.bold(c.cyan(title))}\n${c.gray('─'.repeat(Math.min(60, title.length + 6)))}`;
}

/** Draw a rounded box around multi-line content. */
export function box(content: string, opts: { title?: string; color?: (s: string) => string } = {}): string {
  const color = opts.color ?? c.cyan;
  const lines = content.split('\n');
  const width = Math.max(...lines.map(visibleWidth), opts.title ? visibleWidth(opts.title) + 2 : 0);
  const top = opts.title
    ? color(`╭─ ${c.bold(opts.title)} ${'─'.repeat(Math.max(0, width - visibleWidth(opts.title) - 3))}╮`)
    : color(`╭${'─'.repeat(width + 2)}╮`);
  const bottom = color(`╰${'─'.repeat(width + 2)}╯`);
  const body = lines
    .map((l) => `${color('│')} ${l}${' '.repeat(Math.max(0, width - visibleWidth(l)))} ${color('│')}`)
    .join('\n');
  return `${top}\n${body}\n${bottom}`;
}

/** Indent every line of a block by n spaces. */
export function indent(text: string, n = 2): string {
  const prefix = ' '.repeat(n);
  return text
    .split('\n')
    .map((l) => prefix + l)
    .join('\n');
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** A lightweight TTY spinner. No-ops when stdout is not a TTY. */
export class Spinner {
  private frame = 0;
  private timer: NodeJS.Timeout | null = null;
  private text: string;
  private readonly active: boolean;

  constructor(text: string) {
    this.text = text;
    this.active = Boolean(process.stdout.isTTY) && !process.env.DEVDOCTOR_NO_SPINNER;
  }

  start(): this {
    if (!this.active) return this;
    this.timer = setInterval(() => {
      const f = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
      process.stdout.write(`\r${c.cyan(f)} ${this.text}  `);
      this.frame++;
    }, 80);
    this.timer.unref?.();
    return this;
  }

  update(text: string): void {
    this.text = text;
  }

  stop(finalLine?: string): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.active) process.stdout.write('\r\u001b[K');
    if (finalLine) process.stdout.write(finalLine + '\n');
  }
}

/** Pluralize helper. */
export function plural(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + 's'}`;
}
