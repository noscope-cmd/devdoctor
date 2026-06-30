# 📥 Come installare DevDoctor

L'obiettivo è installarlo **una volta sola** in modo globale, così poi puoi
scrivere `devdoctor` da qualsiasi cartella del terminale, in qualsiasi momento.

> Requisito: **Node.js ≥ 18** (verifica con `node --version`).

---

## ⚡ Metodo veloce (script automatico)

Dalla cartella del progetto:

```bash
cd devdoctor
./install.sh
```

Lo script installa le dipendenze, compila e collega il comando globale.
Salta direttamente alla sezione **"Verifica"** in fondo.

---

## 🛠️ Metodo manuale (passo per passo)

### 1. Entra nella cartella del progetto

```bash
cd devdoctor
```

### 2. Installa le dipendenze e compila

```bash
npm install
npm run build
```

### 3. Installa il comando globale

```bash
npm link
```

`npm link` crea un collegamento globale: ora `devdoctor` è un comando di sistema
che punta a questo progetto.

> 💡 In alternativa, per una vera installazione globale (copia, non collegamento):
> ```bash
> npm install -g .
> ```

---

## ⚠️ Se ottieni un errore di permessi (`EACCES`)

Su molti sistemi npm prova a scrivere in una cartella di sistema protetta.
**Non usare `sudo`** — configura invece una cartella globale nella tua home:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
```

Poi aggiungi quella cartella al PATH (una volta sola). Scegli la riga giusta
per la tua shell:

```bash
# Bash
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc && source ~/.bashrc

# Zsh (default su macOS)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc && source ~/.zshrc
```

Ora ripeti `npm link` (o `npm install -g .`).

### 🪟 Su Windows

Apri **PowerShell** o **Windows Terminal** ed esegui gli stessi comandi
(`npm install`, `npm run build`, `npm link`). npm aggiunge automaticamente la
sua cartella globale al PATH, quindi di solito non serve configurare nulla.

---

## ✅ Verifica

Da **qualsiasi** cartella:

```bash
devdoctor --version      # → devdoctor v1.0.0
devdoctor                # esegue la diagnosi completa
devdoctor --help         # elenco di tutti i comandi
```

Se vedi la versione, sei a posto: il comando è installato globalmente. 🎉

---

## 🔄 Aggiornare dopo modifiche al codice

Se hai usato `npm link`, ti basta ricompilare — il collegamento resta valido:

```bash
npm run build
```

## 🗑️ Disinstallare

```bash
npm unlink -g devdoctor       # se avevi usato npm link
# oppure
npm uninstall -g devdoctor    # se avevi usato npm install -g
```
