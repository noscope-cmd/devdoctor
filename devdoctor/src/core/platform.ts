/**
 * Platform detection helpers.
 * @packageDocumentation
 */

import os from 'node:os';
import type { PlatformInfo } from './types.js';

/** Build a normalized {@link PlatformInfo} for the current host. */
export function detectPlatform(): PlatformInfo {
  const platform = process.platform;
  const osName =
    platform === 'darwin'
      ? 'macOS'
      : platform === 'win32'
        ? 'Windows'
        : platform === 'linux'
          ? 'Linux'
          : platform;
  return {
    os: platform,
    osName,
    arch: process.arch,
    isWindows: platform === 'win32',
    isMac: platform === 'darwin',
    isLinux: platform === 'linux',
  };
}

/** Friendly OS release string, e.g. "macOS 14.4" or "Ubuntu 22.04". */
export function osRelease(): string {
  return `${os.type()} ${os.release()}`;
}
