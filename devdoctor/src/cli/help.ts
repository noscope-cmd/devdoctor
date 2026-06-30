/**
 * Help and usage text.
 * @packageDocumentation
 */

import { c } from '../ui/colors.js';
import { banner } from '../reporters/terminal.js';
import { VERSION } from '../core/engine.js';

/** Full help text. */
export function helpText(): string {
  return `${banner()}
${c.bold('USAGE')}
  ${c.cyan('devdoctor')} ${c.gray('[command] [options]')}

${c.bold('COMMANDS')}
  ${c.green('doctor')}       Run all diagnostics (default)
  ${c.green('scan')}         Full scan: tools + system + project + git + docker
  ${c.green('tools')}        Check installed developer tools and versions
  ${c.green('ports')}        Scan local TCP ports
  ${c.green('git')}          Git configuration & repository diagnostics
  ${c.green('docker')}       Docker daemon, containers, images & volumes
  ${c.green('project')}      Detect framework, package manager & scripts
  ${c.green('system')}       Show system information (neofetch-style)
  ${c.green('fix')}          Show only issues and their suggested fixes
  ${c.green('report')}       Generate a report (use --html / --markdown / -o file)
  ${c.green('update')}       Check whether DevDoctor itself is up to date

${c.bold('PORT OPTIONS')}
  ${c.cyan('devdoctor ports')}              List used + common free ports
  ${c.cyan('devdoctor ports --used')}       Only ports in use
  ${c.cyan('devdoctor ports --free')}       Only free common dev ports
  ${c.cyan('devdoctor ports --kill 3000')}  Kill the process on a port

${c.bold('OUTPUT FORMATS')}
  ${c.gray('--json')}            Machine-readable JSON
  ${c.gray('--yaml')}            YAML
  ${c.gray('--markdown')}        Markdown report
  ${c.gray('--html')}            Standalone HTML report
  ${c.gray('-o, --output FILE')} Write output to a file

${c.bold('GLOBAL OPTIONS')}
  ${c.gray('-v, --verbose')}     Show paths, timings and extra detail
  ${c.gray('-q, --quiet')}       Only show warnings and errors
  ${c.gray('-i, --interactive')} Interactive menu mode
  ${c.gray('--only <q>')}        Run only checks matching id/tag (repeatable)
  ${c.gray('--no-color')}        Disable colored output
  ${c.gray('--plugin <path>')}   Load an extra plugin module
  ${c.gray('-h, --help')}        Show this help
  ${c.gray('-V, --version')}     Show version

${c.bold('EXAMPLES')}
  ${c.gray('$ devdoctor')}                       ${c.dim('# full doctor view')}
  ${c.gray('$ devdoctor tools --json')}          ${c.dim('# tools as JSON')}
  ${c.gray('$ devdoctor report --html -o env.html')}
  ${c.gray('$ devdoctor ports --kill 5432')}

DevDoctor v${VERSION} · MIT License
`;
}
