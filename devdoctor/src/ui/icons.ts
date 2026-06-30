/**
 * Unicode icons and severity glyphs.
 *
 * Falls back to ASCII when the terminal can't render Unicode
 * (heuristic: Windows legacy console without UTF-8).
 * @packageDocumentation
 */

import { Severity } from '../core/types.js';
import { c } from './colors.js';

const unicode =
  process.platform !== 'win32' || process.env.WT_SESSION !== undefined || process.env.TERM_PROGRAM !== undefined;

export const icons = {
  ok: unicode ? '✅' : '[OK]',
  warning: unicode ? '⚠️' : '[!]',
  error: unicode ? '❌' : '[X]',
  skipped: unicode ? '➖' : '[-]',
  bullet: unicode ? '•' : '*',
  arrow: unicode ? '→' : '->',
  fix: unicode ? '🔧' : '>>',
  rocket: unicode ? '🚀' : '',
  heart: unicode ? '🩺' : '',
  search: unicode ? '🔍' : '',
  package: unicode ? '📦' : '',
  gear: unicode ? '⚙️' : '',
  folder: unicode ? '📁' : '',
  computer: unicode ? '🖥️' : '',
  link: unicode ? '🔗' : '',
  blockFull: unicode ? '█' : '#',
  blockEmpty: unicode ? '░' : '-',
};

/** Colored severity badge with icon. */
export function severityBadge(sev: Severity): string {
  switch (sev) {
    case Severity.Ok:
      return c.green(icons.ok);
    case Severity.Warning:
      return c.yellow(icons.warning);
    case Severity.Error:
      return c.red(icons.error);
    case Severity.Skipped:
      return c.gray(icons.skipped);
  }
}

/** Colorize text according to severity. */
export function severityColor(sev: Severity, text: string): string {
  switch (sev) {
    case Severity.Ok:
      return c.green(text);
    case Severity.Warning:
      return c.yellow(text);
    case Severity.Error:
      return c.red(text);
    case Severity.Skipped:
      return c.gray(text);
  }
}
