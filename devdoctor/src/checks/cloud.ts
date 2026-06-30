/**
 * Cloud & infrastructure CLI checks: kubectl, Terraform, AWS, Azure, gcloud.
 * @packageDocumentation
 */

import { toolCheck } from '../core/check.js';
import { parseVersion } from '../utils/exec.js';
import type { Check } from '../core/types.js';

export const cloudChecks: Check[] = [
  toolCheck({
    id: 'kubectl',
    title: 'Kubernetes (kubectl)',
    category: 'cloud',
    bin: 'kubectl',
    versionArgs: ['version', '--client', '-o', 'yaml'],
    scored: false,
    tags: ['k8s', 'kubernetes'],
    install: {
      description: 'Install kubectl',
      command: 'brew install kubectl',
      url: 'https://kubernetes.io/docs/tasks/tools/',
    },
    extra: (_ctx, found) => {
      const m = found.raw.match(/gitVersion:\s*v?([\d.]+)/);
      if (m) return { version: m[1], summary: `v${m[1]}` };
      return undefined;
    },
  }),
  toolCheck({
    id: 'terraform',
    title: 'Terraform',
    category: 'cloud',
    bin: 'terraform',
    versionArgs: ['version'],
    scored: false,
    tags: ['iac', 'hashicorp'],
    install: {
      description: 'Install Terraform',
      command: 'brew install terraform',
      url: 'https://developer.hashicorp.com/terraform/install',
    },
  }),
  toolCheck({
    id: 'aws',
    title: 'AWS CLI',
    category: 'cloud',
    bin: 'aws',
    versionArgs: ['--version'],
    scored: false,
    tags: ['aws', 'cloud'],
    install: {
      description: 'Install the AWS CLI',
      command: 'brew install awscli',
      url: 'https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html',
    },
  }),
  toolCheck({
    id: 'azure',
    title: 'Azure CLI',
    category: 'cloud',
    bin: 'az',
    versionArgs: ['version', '--output', 'tsv'],
    scored: false,
    tags: ['azure', 'cloud'],
    install: {
      description: 'Install the Azure CLI',
      command: 'brew install azure-cli',
      url: 'https://learn.microsoft.com/cli/azure/install-azure-cli',
    },
    extra: (_ctx, found) => {
      const v = parseVersion(found.raw);
      if (v) return { version: v, summary: `v${v}` };
      return undefined;
    },
  }),
  toolCheck({
    id: 'gcloud',
    title: 'Google Cloud CLI',
    category: 'cloud',
    bin: 'gcloud',
    versionArgs: ['version'],
    scored: false,
    tags: ['gcp', 'cloud'],
    install: {
      description: 'Install the Google Cloud CLI',
      command: 'brew install --cask google-cloud-sdk',
      url: 'https://cloud.google.com/sdk/docs/install',
    },
    extra: (_ctx, found) => {
      const m = found.raw.match(/Google Cloud SDK\s+([\d.]+)/);
      if (m) return { version: m[1], summary: `v${m[1]}` };
      return undefined;
    },
  }),
];
