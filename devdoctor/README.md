<div align="center">

# 🩺 DevDoctor

### Diagnostica il tuo ambiente di sviluppo e ricevi i comandi per risolvere ogni problema.

*Pensa a un mix tra `doctor`, `brew doctor` e `neofetch` — veloce, colorato e cross-platform.*

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platforms](https://img.shields.io/badge/platforms-Linux%20%7C%20macOS%20%7C%20Windows-informational)](#-supporto-multipiattaforma)
[![Zero deps](https://img.shields.io/badge/runtime%20deps-0-success)](#-architettura)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

</div>

```text
  ___          ___          _
 |   \ _____ _|   \ ___  __| |_ ___ _ _
 | |) / -_) V / |) / _ \/ _|  _/ _ \ '_|
 |___/\___|\_/|___/\___/\__|\__\___/_|
  Diagnose your development environment
```

---

## 🤔 Cos'è?

**DevDoctor** è uno strumento da riga di comando che, con un solo comando, **scansiona la tua macchina**, rileva gli strumenti di sviluppo installati e le loro versioni, verifica che siano configurati correttamente, assegna un **punteggio di salute** all'ambiente e — la parte più utile — ti dice **esattamente quale comando lanciare** per sistemare ciò che non va.

Niente più "ma perché non funziona?". Lo lanci, leggi, copi-incolli il fix. ✅

---

## ✨ Funzionalità

- 🔍 **28+ controlli** su linguaggi, package manager, container, cloud e database.
- 🚦 **Livelli di gravità** — ✅ Sano · ⚠️ Avviso · ❌ Errore — con spiegazioni leggibili.
- 🔧 **Fix pronti all'uso** — ogni problema arriva con un comando da copiare e incollare.
- 📊 **Punteggio di salute** con barra di avanzamento e valutazione (Excellent, Good, Fair…).
- 🔌 **Scanner di porte** — porte aperte/libere, processo in ascolto, PID… e puoi anche ucciderle.
- 🖥️ **Info di sistema** stile neofetch: OS, kernel, CPU, RAM, disco, shell, IP…
- 🐙 **Diagnostica Git** — identità, chiavi SSH, autenticazione GitHub, stato repo, detached HEAD.
- 🐳 **Diagnostica Docker** — daemon, Compose, container, immagini, volumi, spazio su disco.
- 📁 **Rilevamento progetto** — framework, package manager, build tool, dipendenze, script.
- 📄 **5 formati di output** — terminale, JSON, YAML, Markdown e HTML autoconsistente.
- 🎨 **UX curata** — colori, icone Unicode, tabelle, spinner, barre di avanzamento, modalità interattiva.
- ⚡ **Veloce e concorrente** — una scansione completa in **meno di 3 secondi** (~0.3s in pratica).
- 📦 **Zero dipendenze runtime** — solo moduli nativi di Node.js. Tipizzato al 100%. Estendibile con plugin.

---

## 📥 Installazione

> Requisito: **Node.js ≥ 18** (verifica con `node --version`).

```bash
# 1. Clona il repository
git clone https://github.com/SamaX-gg/devdoctor.git
cd devdoctor

# 2. Installa e compila
npm install
npm run build

# 3. Rendi "devdoctor" un comando globale
npm link
```

Ora puoi scrivere `devdoctor` da **qualsiasi cartella**. 🎉

> 💡 In alternativa esegui lo script automatico: `./install.sh`
> Per dettagli, problemi di permessi e istruzioni Windows → **[INSTALL.md](INSTALL.md)**.

---

## 🚀 Uso

```bash
devdoctor                 # diagnosi completa (default)
devdoctor doctor          # come sopra
devdoctor scan            # tutto: tool + sistema + progetto + git + docker
devdoctor tools           # solo versioni degli strumenti
devdoctor ports           # scansiona le porte TCP locali
devdoctor git             # diagnostica Git
devdoctor docker          # diagnostica Docker
devdoctor project         # rileva framework / package manager / script
devdoctor system          # informazioni di sistema
devdoctor fix             # mostra solo i problemi + i fix suggeriti
devdoctor report          # genera un report su file
devdoctor update          # controlla se DevDoctor stesso è aggiornato
```

### 🔌 Scanner di porte

```bash
devdoctor ports                 # porte usate + porte dev comuni libere
devdoctor ports --used          # solo porte in uso
devdoctor ports --free          # solo porte dev comuni libere
devdoctor ports --kill 3000     # uccide il processo in ascolto su una porta
```

```text
PORT   STATUS    PROCESS       PID
3000   In Use    node          12345
5432   In Use    postgres        921
6379   In Use    redis-server   2100
8080   Free
5173   Free
```

### 📄 Formati di output

```bash
devdoctor tools --json                   # JSON su stdout
devdoctor tools --yaml                    # YAML su stdout
devdoctor report --markdown -o env.md     # report Markdown
devdoctor report --html -o env.html       # report HTML autoconsistente
```

### ⚙️ Opzioni globali

| Flag | Descrizione |
| ---- | ----------- |
| `-v, --verbose` | Mostra percorsi, tempi e dettagli extra |
| `-q, --quiet` | Mostra solo avvisi ed errori |
| `-i, --interactive` | Modalità menu interattiva |
| `--only <q>` | Esegue solo i check che combaciano con un id/tag |
| `--no-color` | Disabilita i colori |
| `--plugin <path>` | Carica un plugin extra |
| `-o, --output <file>` | Scrive l'output su file |
| `-h, --help` / `-V, --version` | Aiuto / versione |

> DevDoctor esce con **codice diverso da zero** quando trova problemi critici → perfetto per la CI.

---

## 🩻 Cosa viene controllato

| Categoria | Strumenti |
| -------- | ----- |
| **Controllo Versione** | Git (+ identità, chiavi SSH, auth GitHub, stato repo) |
| **Linguaggi** | Node.js, Python, Rust, Go, Java |
| **Package Manager** | npm, pnpm, Yarn, Bun, pip, uv, Poetry, Cargo, Maven, Gradle |
| **Container** | Docker (+ daemon), Docker Compose |
| **Cloud / Infra** | kubectl, Terraform, AWS CLI, Azure CLI, gcloud |
| **Database** | PostgreSQL, MySQL, Redis, MongoDB, SQLite |

Ogni check verifica: **installato → versione → presente nel PATH → funzionante → configurazione**.

---

## 🖥️ Supporto multipiattaforma

DevDoctor è cross-platform per progettazione. Ogni operazione specifica dell'OS usa lo strumento nativo giusto:

| Aspetto | Linux | macOS | Windows |
| ------- | :---: | :---: | :---: |
| Rilevamento strumenti (PATH) | ✅ | ✅ | ✅ (risolve `.exe`/`.cmd`/`.bat` via PATHEXT) |
| Shim package manager (`npm`, `pnpm`, `yarn`) | ✅ | ✅ | ✅ (instradati tramite `cmd.exe`) |
| Scanner porte | `lsof` → `ss` → `netstat` | `lsof` | `netstat -ano` + `tasklist` |
| Uccidi porta | `kill -9` | `kill -9` | `taskkill /F` |
| Uso disco | `df` | `df` | PowerShell, fallback `wmic` |
| Colori / Unicode | ✅ | ✅ | ✅ (Windows Terminal; fallback ASCII su console legacy) |

> 🪟 **Su Windows** usa Windows Terminal o PowerShell 7+ per l'esperienza completa con i colori.

---

## 🧩 Plugin ed estendibilità

Aggiungere un nuovo controllo è volutamente banale. Crea un `devdoctor.config.mjs` nella root del tuo progetto (oppure mettilo in `~/.devdoctor/plugins/`):

```js
import { toolCheck, defineCheck, Severity } from 'devdoctor';

export default {
  name: 'my-plugin',
  register(registry) {
    // Un controllo standard in 3 righe:
    registry.add(toolCheck({
      id: 'deno', title: 'Deno', category: 'languages', bin: 'deno', scored: false,
    }));

    // …oppure un check completamente personalizzato:
    registry.add(defineCheck({
      id: 'env.file', title: '.env presente', category: 'project',
      run: async (ctx) => ({
        id: 'env.file', title: '.env presente',
        severity: Severity.Ok, summary: 'Trovato',
      }),
    }));
  },
};
```

Esempio completo in [`examples/devdoctor.config.mjs`](examples/devdoctor.config.mjs).

---

## 🏗️ Architettura

```text
src/
├── core/          # types, registry, engine (runner concorrente + scoring), platform
├── checks/        # check integrati + diagnostiche profonde (git, docker, porte, progetto, sistema)
├── reporters/     # terminal, json/yaml, markdown, html
├── ui/            # colori, icone, primitive di rendering (tabelle, barre, spinner, box)
├── utils/         # exec runner con cache, parsing versioni, serializzatore yaml
├── plugins/       # caricatore di plugin
├── cli/           # parser argomenti, handler comandi, modalità interattiva, help
└── cli.ts         # entry point
```

**Principi di design**

- 🧱 **Modulare e tipizzato** — ogni check è una piccola unità isolata e completamente tipizzata.
- ⚡ **Concorrente** — tutti i check I/O-bound girano in parallelo con concorrenza limitata.
- 💾 **Con cache** — il command runner memoizza le invocazioni identiche nella stessa esecuzione.
- 🛡️ **Resiliente** — un timeout per comando evita che un tool bloccato fermi la scansione.
- 🔌 **Estendibile** — un nuovo check richiede ~5 righe con la factory `toolCheck`.

---

## 🧪 Sviluppo

```bash
npm install
npm run build         # compila TypeScript in dist/
npm run typecheck     # type-check senza emettere
node --test           # esegue la suite di test (dopo la build)
```

L'API programmatica è completamente esportata:

```ts
import { createRegistry, buildContext, runChecks, toJson } from 'devdoctor';

const report = await runChecks(createRegistry(), buildContext());
console.log(report.score.percent, report.score.label);
console.log(toJson(report));
```

---

## 🤝 Contribuire

I contributi sono benvenuti! Apri una *issue* per discutere un'idea o invia direttamente una *pull request*.

1. Fai il fork del repo
2. Crea un branch (`git checkout -b feature/mia-feature`)
3. Assicurati che `npm run typecheck` e `node --test` passino
4. Apri la PR 🚀

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Vedi [LICENSE](LICENSE) per i dettagli.

---

<div align="center">

### Made with 🩺 by **noscope** · [SamaX.gg](https://SamaX.gg)

*Se DevDoctor ti è stato utile, lascia una ⭐ al repo!*

</div>
