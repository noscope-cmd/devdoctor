/**
 * Package & build manager checks: npm, pnpm, Yarn, Bun, pip, uv, Poetry,
 * Cargo, Maven, Gradle.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import type { Check } from '../core/types.js';

export const packageManagerChecks: Check[] = [
  toolCheck({
    id: 'npm',
    title: 'npm',
    category: 'package-managers',
    bin: 'npm',
    tags: ['node', 'js'],
    install: {
      description: 'npm ships with Node.js',
      url: 'https://nodejs.org/',
    },
  }),
  toolCheck({
    id: 'pnpm',
    title: 'pnpm',
    category: 'package-managers',
    bin: 'pnpm',
    scored: false,
    tags: ['node', 'js'],
    install: {
      description: 'Install pnpm',
      command: 'corepack enable pnpm  # or: npm i -g pnpm',
      url: 'https://pnpm.io/installation',
    },
  }),
  toolCheck({
    id: 'yarn',
    title: 'Yarn',
    category: 'package-managers',
    bin: 'yarn',
    scored: false,
    tags: ['node', 'js'],
    install: {
      description: 'Install Yarn',
      command: 'corepack enable  # or: npm i -g yarn',
      url: 'https://yarnpkg.com/getting-started/install',
    },
  }),
  toolCheck({
    id: 'bun',
    title: 'Bun',
    category: 'package-managers',
    bin: 'bun',
    scored: false,
    tags: ['node', 'js', 'runtime'],
    install: {
      description: 'Install Bun',
      command: 'curl -fsSL https://bun.sh/install | bash',
      url: 'https://bun.sh/',
    },
  }),
  toolCheck({
    id: 'pip',
    title: 'pip',
    category: 'package-managers',
    bin: ['pip3', 'pip'],
    tags: ['python'],
    install: {
      description: 'Bootstrap pip',
      command: 'python3 -m ensurepip --upgrade',
      url: 'https://pip.pypa.io/',
    },
  }),
  toolCheck({
    id: 'uv',
    title: 'uv',
    category: 'package-managers',
    bin: 'uv',
    scored: false,
    tags: ['python'],
    install: {
      description: 'Install uv',
      command: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
      url: 'https://docs.astral.sh/uv/',
    },
  }),
  toolCheck({
    id: 'poetry',
    title: 'Poetry',
    category: 'package-managers',
    bin: 'poetry',
    scored: false,
    tags: ['python'],
    install: {
      description: 'Install Poetry',
      command: 'curl -sSL https://install.python-poetry.org | python3 -',
      url: 'https://python-poetry.org/',
    },
  }),
  toolCheck({
    id: 'cargo',
    title: 'Cargo',
    category: 'package-managers',
    bin: 'cargo',
    tags: ['rust'],
    install: {
      description: 'Cargo ships with rustup',
      command: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
      url: 'https://rustup.rs/',
    },
  }),
  toolCheck({
    id: 'maven',
    title: 'Maven',
    category: 'package-managers',
    bin: 'mvn',
    versionArgs: ['-version'],
    scored: false,
    tags: ['java', 'jvm'],
    install: {
      description: 'Install Maven',
      command: 'brew install maven',
      url: 'https://maven.apache.org/',
    },
  }),
  toolCheck({
    id: 'gradle',
    title: 'Gradle',
    category: 'package-managers',
    bin: 'gradle',
    versionArgs: ['-version'],
    scored: false,
    tags: ['java', 'jvm'],
    install: {
      description: 'Install Gradle',
      command: 'brew install gradle',
      url: 'https://gradle.org/install/',
    },
  }),
];
