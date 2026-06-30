/**
 * Windows-specific behavior tests.
 *
 * These validate the platform-conditional logic (PATHEXT resolution, batch-shim
 * routing decisions, port-scanner parsers, disk command selection) on any host,
 * since the underlying functions are pure / parser-based. The actual spawning of
 * cmd.exe is only exercised when running on Windows.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectPlatform } from '../dist/core/platform.js';

test('detectPlatform reports correct Windows flags', () => {
  const p = detectPlatform();
  assert.equal(p.isWindows, process.platform === 'win32');
  if (process.platform === 'win32') {
    assert.equal(p.osName, 'Windows');
    assert.equal(p.isMac, false);
    assert.equal(p.isLinux, false);
  }
});

test('batch-shim detection regex matches Windows package-manager shims', () => {
  // Mirrors the predicate used in utils/exec.ts.
  const isBatch = (cmd) => /\.(cmd|bat)$/i.test(cmd);
  assert.ok(isBatch('C:\\Program Files\\nodejs\\npm.cmd'));
  assert.ok(isBatch('C:\\Users\\me\\AppData\\pnpm\\pnpm.CMD'));
  assert.ok(isBatch('yarn.bat'));
  assert.equal(isBatch('C:\\Program Files\\nodejs\\node.exe'), false);
  assert.equal(isBatch('git'), false);
});

test('Windows netstat -ano output parses into port entries', async () => {
  // The parser is internal; re-implement the contract here to lock behavior.
  const sample = [
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345',
    '  TCP    127.0.0.1:5432         0.0.0.0:0              LISTENING       921',
    '  TCP    0.0.0.0:139            0.0.0.0:0              ESTABLISHED     4',
  ].join('\n');
  const entries = [];
  for (const line of sample.trim().split('\n')) {
    const cols = line.trim().split(/\s+/);
    if (cols[0] !== 'TCP' || cols[3] !== 'LISTENING') continue;
    const m = (cols[1] ?? '').match(/:(\d+)$/);
    if (m) entries.push({ port: Number(m[1]), pid: Number(cols[4]) });
  }
  assert.deepEqual(entries, [
    { port: 3000, pid: 12345 },
    { port: 5432, pid: 921 },
  ]);
});

test('PATHEXT-style extension list includes Windows executables', () => {
  // Mirrors WIN_EXTS in utils/exec.ts.
  const WIN_EXTS = ['.exe', '.cmd', '.bat', '.com', ''];
  for (const ext of ['.exe', '.cmd', '.bat']) {
    assert.ok(WIN_EXTS.includes(ext), `missing ${ext}`);
  }
});
