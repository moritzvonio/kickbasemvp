#!/usr/bin/env bash
# BetterBase one-shot setup
# Macht: GitHub-Repo + Vercel-Projekt + Env-Vars + Deploy
# Was du brauchst: nur GitHub- und Vercel-Account (kostenlos)
# Stripe ist separat (./setup-stripe.sh) — kannst du später machen

set -e

# ─── colors ────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
  BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; BOLD=""; NC=""
fi
ok()    { printf "${GREEN}✓${NC}  %s\n" "$1"; }
info()  { printf "${BLUE}→${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}!${NC}  %s\n" "$1"; }
err()   { printf "${RED}✗${NC}  %s\n" "$1"; }
step()  { printf "\n${BOLD}━━━ %s ━━━${NC}\n" "$1"; }

cd "$(dirname "$0")"

cat <<'BANNER'

  ██████╗ ███████╗████████╗████████╗███████╗██████╗ ██████╗  █████╗ ███████╗███████╗
  ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝██████╔╝███████║███████╗█████╗
  ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║╚════██║██╔══╝
  ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║██████╔╝██║  ██║███████║███████╗
  ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝

       One-Shot Setup — GitHub + Vercel + Deploy in einem Rutsch
BANNER

# ─── 1. Prereqs ────────────────────────────────────────────────
step "Schritt 1/6 — Prüfe ob alle Tools installiert sind"
MISSING=0
for cmd in node pnpm git openssl; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd vorhanden"
  else
    err "$cmd FEHLT"
    MISSING=1
  fi
done
if ! command -v gh >/dev/null 2>&1; then
  err "GitHub CLI (gh) FEHLT — installiere mit: brew install gh"
  MISSING=1
else
  ok "gh vorhanden"
fi
if [ $MISSING -ne 0 ]; then
  err "Bitte fehlende Tools installieren und Skript neu starten."
  exit 1
fi

# ─── 2. .env.local ─────────────────────────────────────────────
step "Schritt 2/6 — Lokale Secrets generieren (.env.local)"
SS=""; VPK=""; VPV=""
if [ -f .env.local ] && grep -q "^SESSION_SECRET=" .env.local; then
  SS=$(grep "^SESSION_SECRET=" .env.local | head -1 | cut -d'=' -f2-)
  ok ".env.local existiert schon — übernehme bestehendes SESSION_SECRET"
else
  SS=$(openssl rand -hex 32)
  cat > .env.local <<EOF
KICKBASE_API_BASE=https://api.kickbase.com
SESSION_SECRET=$SS
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BetterBase
EOF
  ok ".env.local mit zufälligem SESSION_SECRET geschrieben"
fi

if grep -q "^VAPID_PRIVATE_KEY=" .env.local 2>/dev/null; then
  VPK=$(grep "^NEXT_PUBLIC_VAPID_PUBLIC_KEY=" .env.local | head -1 | cut -d'=' -f2-)
  VPV=$(grep "^VAPID_PRIVATE_KEY=" .env.local | head -1 | cut -d'=' -f2-)
  ok "VAPID-Keys schon da — überspringe"
else
  info "VAPID-Keys generieren (für Push-Notifications, dauert ~5 Sek)…"
  VAPID_OUT=$(pnpm dlx web-push generate-vapid-keys --json 2>/dev/null || echo "{}")
  VPK=$(printf "%s" "$VAPID_OUT" | sed -n 's/.*"publicKey":"\([^"]*\)".*/\1/p')
  VPV=$(printf "%s" "$VAPID_OUT" | sed -n 's/.*"privateKey":"\([^"]*\)".*/\1/p')
  if [ -z "$VPK" ] || [ -z "$VPV" ]; then
    warn "VAPID-Generierung fehlgeschlagen — Push wird später manuell konfiguriert"
  else
    cat >> .env.local <<EOF

NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VPK
VAPID_PRIVATE_KEY=$VPV
VAPID_SUBJECT=mailto:noreply@betterbase.app
EOF
    ok "VAPID-Keys generiert"
  fi
fi

# ─── 3. GitHub ──────────────────────────────────────────────────
step "Schritt 3/6 — GitHub-Repo erstellen + pushen"
if git remote get-url origin >/dev/null 2>&1; then
  ORIGIN=$(git remote get-url origin)
  ok "Origin schon gesetzt: $ORIGIN"
  info "Push…"
  git push -u origin main 2>&1 | tail -3 || warn "Push hat nicht geklappt (vielleicht keine Permissions)"
else
  if ! gh auth status >/dev/null 2>&1; then
    warn "Du bist nicht bei GitHub eingeloggt."
    echo "    Browser wird gleich geöffnet — wähle 'Login with browser'."
    read -r -p "    Bereit? [Enter]"
    gh auth login
  fi

  read -r -p "    Repo-Name [betterbase]: " REPO
  REPO=${REPO:-betterbase}
  read -r -p "    Privates Repo? [j/N]: " PRIVATE_ANS
  PRIVACY="--public"
  case "$PRIVATE_ANS" in [jJyY]*) PRIVACY="--private";; esac

  info "Erstelle GitHub-Repo + push…"
  gh repo create "$REPO" $PRIVACY --source=. --remote=origin --push
  ok "Repo erstellt + Code gepusht"
fi

# ─── 4. Vercel CLI ──────────────────────────────────────────────
step "Schritt 4/6 — Vercel CLI vorbereiten"
VERCEL="pnpm dlx vercel@latest"
if ! $VERCEL whoami >/dev/null 2>&1; then
  warn "Du bist nicht bei Vercel eingeloggt."
  echo "    Browser wird gleich geöffnet — wähle 'Continue with GitHub'."
  read -r -p "    Bereit? [Enter]"
  $VERCEL login
fi
WHO=$($VERCEL whoami 2>/dev/null || echo "?")
ok "Eingeloggt als: $WHO"

# ─── 5. Vercel link + env vars ──────────────────────────────────
step "Schritt 5/6 — Vercel-Projekt anlegen + Env-Vars setzen"
if [ -d .vercel ]; then
  ok "Vercel-Projekt schon verlinkt"
else
  info "Lege Vercel-Projekt an…"
  $VERCEL link --yes
fi

set_env() {
  local name="$1"; local value="$2"
  if [ -z "$value" ]; then return; fi
  # Remove existing first (ignore errors), then add fresh
  $VERCEL env rm "$name" production --yes >/dev/null 2>&1 || true
  printf "%s" "$value" | $VERCEL env add "$name" production >/dev/null 2>&1 \
    && ok "Env gesetzt: $name" \
    || warn "Konnte $name nicht setzen — manuell im Vercel-Dashboard nachholen"
}

info "Setze Production-Env-Vars…"
set_env "KICKBASE_API_BASE" "https://api.kickbase.com"
set_env "SESSION_SECRET" "$SS"
set_env "NEXT_PUBLIC_APP_NAME" "BetterBase"
[ -n "$VPK" ] && set_env "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "$VPK"
[ -n "$VPV" ] && set_env "VAPID_PRIVATE_KEY" "$VPV"
[ -n "$VPK" ] && set_env "VAPID_SUBJECT" "mailto:noreply@betterbase.app"

# ─── 6. Deploy ──────────────────────────────────────────────────
step "Schritt 6/6 — Deploy auf Production"
info "Deployment läuft (~2 Min)…"
DEPLOY_OUT=$($VERCEL deploy --prod --yes 2>&1)
echo "$DEPLOY_OUT" | tail -10
URL=$(printf "%s" "$DEPLOY_OUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1)

if [ -n "$URL" ]; then
  # Patch NEXT_PUBLIC_APP_URL with the real URL + redeploy once
  set_env "NEXT_PUBLIC_APP_URL" "$URL"
  info "Redeploy mit korrekter App-URL…"
  $VERCEL deploy --prod --yes >/dev/null 2>&1 || true
  ok "FERTIG"
  cat <<DONE

  ${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
  ${GREEN}${BOLD}  Deine BetterBase ist live:${NC}
  ${GREEN}${BOLD}  $URL${NC}
  ${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

  Nächste Schritte (alles optional):
  • Eigene Domain verbinden:  Vercel → Settings → Domains
  • Stripe für Pro-Käufe:     ./setup-stripe.sh   (kommt noch)
  • Push-Notifications:       schon gesetzt — User aktiviert auf /account

DONE
else
  err "Deploy-URL konnte nicht aus Output gelesen werden."
  echo "Schau im Vercel-Dashboard: https://vercel.com/dashboard"
fi
