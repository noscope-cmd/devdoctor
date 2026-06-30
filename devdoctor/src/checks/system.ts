/**
 * System information collector.
 * @packageDocumentation
 */

import os from 'node:os';
import { networkInterfaces, hostname, userInfo } from 'node:os';
import type { CheckContext } from '../core/types.js';

/** Structured system information for reporting. */
export interface SystemInfo {
  osName: string;
  kernel: string;
  arch: string;
  cpu: string;
  cpuCores: number;
  memoryTotal: string;
  memoryUsed: string;
  memoryPercent: number;
  diskUsed?: string;
  diskTotal?: string;
  diskPercent?: number;
  shell: string;
  terminal: string;
  user: string;
  hostname: string;
  ipAddresses: string[];
  uptime: string;
}

function fmtBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

/** Gather disk usage for the cwd filesystem (best-effort, cross-platform). */
async function diskUsage(
  ctx: CheckContext,
): Promise<{ used?: string; total?: string; percent?: number }> {
  if (ctx.platform.isWindows) {
    // Prefer PowerShell (wmic is deprecated/removed on Windows 11+).
    const ps = await ctx.run('powershell', [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ' +
        'ForEach-Object { "$($_.Size) $($_.FreeSpace)" }',
    ]);
    let total = 0;
    let free = 0;
    if (ps.ok && ps.stdout.trim()) {
      for (const l of ps.stdout.trim().split('\n')) {
        const [t, f] = l.trim().split(/\s+/).map(Number);
        if (!isNaN(t) && !isNaN(f)) {
          total += t;
          free += f;
        }
      }
    } else {
      // Fallback to wmic for older Windows.
      const r = await ctx.run('cmd', ['/c', 'wmic logicaldisk get size,freespace,caption']);
      if (r.ok) {
        for (const l of r.stdout.trim().split('\n').slice(1).filter(Boolean)) {
          const parts = l.trim().split(/\s+/);
          const f = Number(parts[1]);
          const t = Number(parts[2]);
          if (!isNaN(f) && !isNaN(t)) {
            free += f;
            total += t;
          }
        }
      }
    }
    if (total > 0) {
      const used = total - free;
      return { used: fmtBytes(used), total: fmtBytes(total), percent: Math.round((used / total) * 100) };
    }
    return {};
  }
  const r = await ctx.run('df', ['-k', ctx.cwd]);
  if (r.ok) {
    const line = r.stdout.trim().split('\n').pop() ?? '';
    const parts = line.split(/\s+/);
    // Filesystem 1K-blocks Used Available Use% Mounted
    const totalK = Number(parts[1]);
    const usedK = Number(parts[2]);
    if (!isNaN(totalK) && !isNaN(usedK)) {
      return {
        used: fmtBytes(usedK * 1024),
        total: fmtBytes(totalK * 1024),
        percent: Math.round((usedK / totalK) * 100),
      };
    }
  }
  return {};
}

/** Detect terminal program name from environment. */
function detectTerminal(): string {
  return (
    process.env.TERM_PROGRAM ||
    (process.env.WT_SESSION ? 'Windows Terminal' : '') ||
    process.env.TERMINAL_EMULATOR ||
    process.env.TERM ||
    'unknown'
  );
}

/** Collect full {@link SystemInfo}. */
export async function collectSystemInfo(ctx: CheckContext): Promise<SystemInfo> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const disk = await diskUsage(ctx);
  const ips: string[] = [];
  const nics = networkInterfaces();
  for (const name of Object.keys(nics)) {
    for (const ni of nics[name] ?? []) {
      if (!ni.internal && ni.family === 'IPv4') ips.push(`${ni.address} (${name})`);
    }
  }

  let user = 'unknown';
  try {
    user = userInfo().username;
  } catch {
    /* sandboxed */
  }

  return {
    osName: ctx.platform.osName,
    kernel: `${os.type()} ${os.release()}`,
    arch: ctx.platform.arch,
    cpu: cpus[0]?.model.trim() ?? 'unknown',
    cpuCores: cpus.length,
    memoryTotal: fmtBytes(totalMem),
    memoryUsed: fmtBytes(usedMem),
    memoryPercent: Math.round((usedMem / totalMem) * 100),
    diskUsed: disk.used,
    diskTotal: disk.total,
    diskPercent: disk.percent,
    shell: process.env.SHELL || process.env.ComSpec || 'unknown',
    terminal: detectTerminal(),
    user,
    hostname: hostname(),
    ipAddresses: ips.length ? ips : ['127.0.0.1 (loopback)'],
    uptime: fmtUptime(os.uptime()),
  };
}
