/**
 * Language & runtime checks: Node, Python, Rust, Go, Java.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import { parseVersion } from '../utils/exec.js';
import type { Check } from '../core/types.js';

export const languageChecks: Check[] = [
  toolCheck({
    id: 'node',
    title: 'Node.js',
    category: 'languages',
    bin: 'node',
    minVersion: '18.0.0',
    tags: ['js', 'javascript', 'runtime'],
    install: {
      description: 'Install Node.js (LTS)',
      command: 'nvm install --lts  # or: brew install node',
      url: 'https://nodejs.org/',
    },
  }),
  toolCheck({
    id: 'python',
    title: 'Python',
    category: 'languages',
    bin: ['python3', 'python'],
    minVersion: '3.9.0',
    tags: ['py'],
    install: {
      description: 'Install Python 3',
      command: 'brew install python  # or use pyenv',
      url: 'https://www.python.org/downloads/',
    },
  }),
  toolCheck({
    id: 'rust',
    title: 'Rust (rustc)',
    category: 'languages',
    bin: 'rustc',
    tags: ['rust'],
    install: {
      description: 'Install Rust via rustup',
      command: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
      url: 'https://rustup.rs/',
    },
  }),
  toolCheck({
    id: 'go',
    title: 'Go',
    category: 'languages',
    bin: 'go',
    versionArgs: ['version'],
    tags: ['golang'],
    install: {
      description: 'Install Go',
      command: 'brew install go',
      url: 'https://go.dev/dl/',
    },
  }),
  toolCheck({
    id: 'java',
    title: 'Java (JDK)',
    category: 'languages',
    bin: 'java',
    versionArgs: ['-version'],
    tags: ['jvm', 'jdk'],
    install: {
      description: 'Install a JDK (e.g. Temurin)',
      command: 'brew install --cask temurin',
      url: 'https://adoptium.net/',
    },
    extra: (_ctx, found) => {
      // `java -version` prints to stderr; ensure version got parsed.
      const v = parseVersion(found.raw);
      if (v) return { version: v, summary: `v${v}` };
      return undefined;
    },
  }),
];
