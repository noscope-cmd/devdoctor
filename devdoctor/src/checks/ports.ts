/**
 * Local TCP port scanner.
 *
 * Strategy:
 *  - Enumerate listening sockets using the best available OS tool
 *    (`lsof` on macOS, `ss`/`netstat` on Linux, `netstat`+`tasklist` on Windows).
 *  - Optionally probe a curated list of common dev ports to mark them free.
 *  - Support killing the process bound to a port (`--kill`).
 *
 * @packageDocumentation
 */

import type { CheckContext } from '../core/types.js';

/** A single listening port entry. */
export interface PortEntry {
  port: number;
  status: 'In Use' | 'Free';
  process?: string;
  pid?: number;
  address?: string;
  protocol?: string;
}

/** Common development ports we always report on (even when free). */
export const COMMON_DEV_PORTS = [
  3000, 3001, 4000, 4200, 5000, 5173, 5432, 6379, 8000, 8080, 8081, 8443, 9000, 9229, 27017,
  3306, 5672, 15672, 11211, 1433, 9200,
];

/** Parse `lsof -iTCP -sTCP:LISTEN -P -n` output (macOS / Linux). */
function parseLsof(out: string): PortEntry[] {
  const entries: PortEntry[] = [];
  const lines = out.trim().split('\n').slice(1);
  for (const line of lines) {
    const cols = line.split(/\s+/);
    if (cols.length < 9) continue;
    const proc = cols[0];
    const pid = Number(cols[1]);
    const name = cols[cols.length - 1] || cols[8];
    const m = name.match(/:(\d+)$/);
    if (!m) continue;
    entries.push({
      port: Number(m[1]),
      status: 'In Use',
      process: proc,
      pid,
      address: name,
      protocol: 'TCP',
    });
  }
  return entries;
}

/** Parse `ss -tlnp` output (Linux). */
function parseSs(out: string): PortEntry[] {
  const entries: PortEntry[] = [];
  for (const line of out.trim().split('\n').slice(1)) {
    const cols = line.split(/\s+/);
    const local = cols[3] ?? '';
    const m = local.match(/:(\d+)$/);
    if (!m) continue;
    const procMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
    entries.push({
      port: Number(m[1]),
      status: 'In Use',
      process: procMatch?.[1],
      pid: procMatch ? Number(procMatch[2]) : undefined,
      address: local,
      protocol: 'TCP',
    });
  }
  return entries;
}

/** Parse Windows `netstat -ano` output. */
function parseNetstatWin(out: string): PortEntry[] {
  const entries: PortEntry[] = [];
  for (const line of out.trim().split('\n')) {
    const cols = line.trim().split(/\s+/);
    if (cols[0] !== 'TCP' || cols[3] !== 'LISTENING') continue;
    const local = cols[1] ?? '';
    const m = local.match(/:(\d+)$/);
    if (!m) continue;
    entries.push({
      port: Number(m[1]),
      status: 'In Use',
      pid: Number(cols[4]),
      address: local,
      protocol: 'TCP',
    });
  }
  return entries;
}

/** Enumerate listening TCP ports on this host. */
export async function listListeningPorts(ctx: CheckContext): Promise<PortEntry[]> {
  if (ctx.platform.isWindows) {
    const r = await ctx.run('netstat', ['-ano', '-p', 'TCP']);
    const entries = r.ok ? parseNetstatWin(r.stdout) : [];
    // Resolve PIDs to process names.
    const tl = await ctx.run('tasklist', ['/fo', 'csv', '/nh']);
    if (tl.ok) {
      const map = new Map<number, string>();
      for (const line of tl.stdout.trim().split('\n')) {
        const m = line.match(/^"([^"]+)","(\d+)"/);
        if (m) map.set(Number(m[2]), m[1]);
      }
      for (const e of entries) if (e.pid) e.process = map.get(e.pid);
    }
    return dedupe(entries);
  }

  // Prefer lsof, then ss, then netstat.
  if (await ctx.run.which('lsof')) {
    const r = await ctx.run('lsof', ['-iTCP', '-sTCP:LISTEN', '-P', '-n']);
    if (r.ok || r.stdout) return dedupe(parseLsof(r.stdout));
  }
  if (await ctx.run.which('ss')) {
    const r = await ctx.run('ss', ['-tlnp']);
    if (r.ok || r.stdout) return dedupe(parseSs(r.stdout));
  }
  const r = await ctx.run('netstat', ['-tlnp']);
  if (r.ok || r.stdout) return dedupe(parseSs(r.stdout));
  return [];
}

function dedupe(entries: PortEntry[]): PortEntry[] {
  const map = new Map<number, PortEntry>();
  for (const e of entries) {
    if (!map.has(e.port)) map.set(e.port, e);
  }
  return [...map.values()].sort((a, b) => a.port - b.port);
}

/** Build a combined view: in-use ports + curated free dev ports. */
export async function scanPorts(
  ctx: CheckContext,
  opts: { includeFree?: boolean } = {},
): Promise<PortEntry[]> {
  const used = await listListeningPorts(ctx);
  const usedSet = new Set(used.map((e) => e.port));
  const result = [...used];
  if (opts.includeFree !== false) {
    for (const p of COMMON_DEV_PORTS) {
      if (!usedSet.has(p)) result.push({ port: p, status: 'Free', protocol: 'TCP' });
    }
  }
  return result.sort((a, b) => a.port - b.port);
}

/** Kill the process(es) listening on a given port. Returns killed PIDs. */
export async function killPort(ctx: CheckContext, port: number): Promise<number[]> {
  const used = await listListeningPorts(ctx);
  const targets = used.filter((e) => e.port === port && e.pid);
  const killed: number[] = [];
  for (const t of targets) {
    if (!t.pid) continue;
    if (ctx.platform.isWindows) {
      await ctx.run('taskkill', ['/PID', String(t.pid), '/F'], { fresh: true });
    } else {
      await ctx.run('kill', ['-9', String(t.pid)], { fresh: true });
    }
    killed.push(t.pid);
  }
  return killed;
}
