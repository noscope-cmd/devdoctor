/**
 * Minimal YAML serializer (no external dependency).
 * Handles the subset of values DevDoctor emits: objects, arrays, strings,
 * numbers, booleans, null.
 * @packageDocumentation
 */

function needsQuote(s: string): boolean {
  return (
    s === '' ||
    /^[\s]|[\s]$/.test(s) ||
    /[:#\-?{}\[\],&*!|>'"%@`]/.test(s) ||
    /^(true|false|null|yes|no|~)$/i.test(s) ||
    /^[\d.+-]/.test(s)
  );
}

function scalar(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  return needsQuote(s) ? JSON.stringify(s) : s;
}

/** Serialize a value to YAML. */
export function toYaml(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const sub = toYaml(item, indent + 1).replace(/^\s+/, '');
          return `${pad}- ${sub}`;
        }
        return `${pad}- ${scalar(item)}`;
      })
      .join('\n');
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${pad}{}`;
    return entries
      .map(([k, v]) => {
        if (v !== null && typeof v === 'object' && Object.keys(v).length > 0) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
        }
        if (Array.isArray(v) && v.length > 0) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${scalar(v)}`;
      })
      .join('\n');
  }
  return `${pad}${scalar(value)}`;
}
