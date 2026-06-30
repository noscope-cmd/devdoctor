#!/usr/bin/env bash
#
# DevDoctor installer — installa il comando `devdoctor` a livello globale.
# Gestisce automaticamente il caso dei permessi npm (EACCES) senza usare sudo.
#
set -euo pipefail

cd "$(dirname "$0")"

echo "🩺 Installazione di DevDoctor..."

# 1. Controllo Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js non trovato. Installa Node.js >= 18 da https://nodejs.org/ e riprova."
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Node.js $(node --version) è troppo vecchio. Serve la versione 18 o superiore."
  exit 1
fi
echo "✅ Node.js $(node --version)"

# 2. Dipendenze + build
echo "📦 Installazione dipendenze..."
npm install --no-audit --no-fund

echo "🔨 Compilazione..."
npm run build

# 3. Link globale (con fallback su prefix nella home se mancano i permessi)
echo "🔗 Creazione del comando globale..."
if npm link 2>/dev/null; then
  echo "✅ Collegato."
else
  echo "⚠️  Permessi insufficienti sulla cartella globale di npm."
  echo "   Configuro una cartella globale nella tua home (niente sudo)..."
  mkdir -p "$HOME/.npm-global"
  npm config set prefix "$HOME/.npm-global"
  npm link

  # Assicura che la cartella sia nel PATH per le sessioni future.
  BIN_DIR="$HOME/.npm-global/bin"
  case ":$PATH:" in
    *":$BIN_DIR:"*) : ;;  # già presente
    *)
      SHELL_RC="$HOME/.bashrc"
      [ -n "${ZSH_VERSION:-}" ] && SHELL_RC="$HOME/.zshrc"
      [ "$(basename "${SHELL:-}")" = "zsh" ] && SHELL_RC="$HOME/.zshrc"
      echo "export PATH=$BIN_DIR:\$PATH" >> "$SHELL_RC"
      echo "ℹ️  Aggiunto $BIN_DIR al PATH in $SHELL_RC"
      echo "   Apri un nuovo terminale (o esegui: source $SHELL_RC) per usarlo."
      ;;
  esac
fi

echo ""
echo "🎉 Fatto! Prova ora:"
echo "   devdoctor --version"
echo "   devdoctor"
