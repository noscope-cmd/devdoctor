/**
 * Core type definitions for DevDoctor.
 *
 * Everything in the diagnostic engine speaks in terms of these types.
 * A {@link Check} produces a {@link CheckResult}; results are grouped into
 * {@link CheckGroupResult}s; the full run is a {@link DiagnosticReport}.
 *
 * @packageDocumentation
 */

/** Severity of a single diagnostic result. */
export enum Severity {
  /** Everything is fine. */
  Ok = 'ok',
  /** Non-fatal problem; tool works but could be improved. */
  Warning = 'warning',
  /** Something is broken or missing and should be fixed. */
  Error = 'error',
  /** The check could not be determined (e.g. tool not relevant here). */
  Skipped = 'skipped',
}

/** Numeric weight used when computing the overall health score. */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  [Severity.Ok]: 1,
  [Severity.Warning]: 0.5,
  [Severity.Error]: 0,
  [Severity.Skipped]: 1, // skipped checks don't penalize the score
};

/** A suggested remediation command for a problem. */
export interface SuggestedFix {
  /** Human-readable description of what the fix does. */
  readonly description: string;
  /** Shell command(s) the user can run to apply the fix. */
  readonly command?: string;
  /** Optional documentation URL. */
  readonly url?: string;
}

/** The result of running a single {@link Check}. */
export interface CheckResult {
  /** Stable identifier, e.g. `git`, `node`, `docker.daemon`. */
  readonly id: string;
  /** Short display title, e.g. `Git`. */
  readonly title: string;
  /** Severity outcome. */
  readonly severity: Severity;
  /** One-line summary of the outcome. */
  readonly summary: string;
  /** Detected version string, if applicable. */
  readonly version?: string;
  /** Absolute path to the executable, if applicable. */
  readonly path?: string;
  /** Longer human-readable explanation (shown in verbose mode). */
  readonly detail?: string;
  /** Arbitrary structured metadata for JSON/YAML output. */
  readonly meta?: Record<string, unknown>;
  /** Suggested fixes for any detected problem. */
  readonly fixes?: readonly SuggestedFix[];
  /** Milliseconds the check took to run. */
  readonly durationMs?: number;
  /** Whether this result counts toward the health score. */
  readonly scored?: boolean;
}

/** Logical grouping of checks, e.g. "Languages", "Databases". */
export type CheckCategory =
  | 'vcs'
  | 'languages'
  | 'package-managers'
  | 'cloud'
  | 'containers'
  | 'databases'
  | 'system'
  | 'project'
  | 'custom';

/**
 * A single diagnostic check.
 *
 * Implement this interface (or use the `defineCheck` helper) to add a new
 * diagnostic. Checks are pure async functions of a {@link CheckContext}.
 */
export interface Check {
  /** Stable identifier. */
  readonly id: string;
  /** Display title. */
  readonly title: string;
  /** Category used for grouping in the UI. */
  readonly category: CheckCategory;
  /** Optional tags for filtering (e.g. `['node', 'js']`). */
  readonly tags?: readonly string[];
  /** Whether the check counts toward the health score. Defaults to true. */
  readonly scored?: boolean;
  /** Run the check. */
  run(ctx: CheckContext): Promise<CheckResult> | CheckResult;
}

/** Context handed to every check at runtime. */
export interface CheckContext {
  /** Current working directory the user invoked DevDoctor from. */
  readonly cwd: string;
  /** Detected platform info. */
  readonly platform: PlatformInfo;
  /** Whether verbose output was requested. */
  readonly verbose: boolean;
  /** A memoizing command runner shared across checks. */
  readonly run: CommandRunner;
}

/** Normalized platform information. */
export interface PlatformInfo {
  /** `linux` | `darwin` | `win32` | other. */
  readonly os: NodeJS.Platform;
  /** Friendly name, e.g. `macOS`, `Linux`, `Windows`. */
  readonly osName: string;
  /** CPU architecture, e.g. `x64`, `arm64`. */
  readonly arch: string;
  /** True on Windows. */
  readonly isWindows: boolean;
  /** True on macOS. */
  readonly isMac: boolean;
  /** True on Linux. */
  readonly isLinux: boolean;
}

/** Result of executing a shell command. */
export interface CommandResult {
  readonly ok: boolean;
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
  /** True when the executable was not found at all. */
  readonly notFound: boolean;
}

/** Memoizing async command runner. */
export interface CommandRunner {
  (cmd: string, args?: readonly string[], opts?: RunOptions): Promise<CommandResult>;
  /** Resolve the absolute path to an executable on PATH (cached). */
  which(bin: string): Promise<string | null>;
}

/** Options for {@link CommandRunner}. */
export interface RunOptions {
  /** Per-command timeout in ms. Default 4000. */
  readonly timeoutMs?: number;
  /** Working directory override. */
  readonly cwd?: string;
  /** Bypass the cache and force a fresh run. */
  readonly fresh?: boolean;
}

/** Aggregated result for a category of checks. */
export interface CheckGroupResult {
  readonly category: CheckCategory;
  readonly label: string;
  readonly results: readonly CheckResult[];
}

/** Computed health score summary. */
export interface HealthScore {
  /** 0-100 percentage. */
  readonly percent: number;
  /** Qualitative label, e.g. `Excellent`. */
  readonly label: string;
  readonly passed: number;
  readonly warnings: number;
  readonly errors: number;
  readonly skipped: number;
  readonly total: number;
}

/** Full diagnostic report — the canonical data structure for all reporters. */
export interface DiagnosticReport {
  readonly generatedAt: string;
  readonly version: string;
  readonly platform: PlatformInfo;
  readonly groups: readonly CheckGroupResult[];
  readonly score: HealthScore;
  /** Optional extra sections (system info, ports, project, git, docker). */
  readonly sections?: Record<string, unknown>;
}
