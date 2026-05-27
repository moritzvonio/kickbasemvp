@AGENTS.md

# KB — Kickbase MVP

Bundesliga-Fantasy-Tool auf Basis der Kickbase API (internes Package-Name `kickbasemvp`).

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind · Vercel · `bb-deploy` zsh-Funktion deployed nach Vercel Prod

## Dev-Server
```bash
pnpm dev  # default Port 3000
```

## API-Referenzen
- `docs/kickbase-openapi.json` — OpenAPI-Spec der Kickbase API
- `docs/kickbase-postman.json` — Postman-Collection

## Deploy
`bb-deploy "commit message"` (zsh-Funktion in `~/.zshrc`) — git add/commit/push + `vercel --prod`.
