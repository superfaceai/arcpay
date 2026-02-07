# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the TypeScript application code, organized by domain (for example `payments/`, `identity/`, `web/`).
- `src/app.ts` wires the API and web routes together; `development.ts` is the dev entrypoint.
- Key modules inside `src/`:
  - `accounts/`: account profiles and metadata.
  - `identity/`: identities, contacts, API keys, and auth flows.
  - `balances/`: balances, locations, and chain metadata.
  - `payments/`: payment intents, mandates, captures, and transactions.
  - `notifications/`: notification rules and delivery records.
  - `communications/`: email/SMS providers and messaging helpers.
  - `wallet/`: wallet management plus MCP tooling.
  - `acp/`, `acp-checkouts/`: ACP protocol APIs and checkout flows.
  - `ucp/`, `ucp-checkouts/`, `ucp-payment-handler/`: UCP schemas, profiles, and payment handling.
  - `x402/`: x402 payment server and MCP integration.
  - `arc/`, `arc-facilitator/`: Arc-specific services and facilitator APIs.
  - `circle/`: Circle API integrations.
  - `web/`: server-rendered UI routes and pages.
  - `api/`: API routing utilities and service scaffolding.
  - `config/`: environment configuration and settings.
  - `database/`: storage adapters and persistence helpers.
  - `lib/`: shared utilities and helpers.
  - `mcp/`: MCP server configuration and helpers.
  - `features/`: feature flags and gated behavior.
  - `erasure/`: data erasure workflows.
- `public/` hosts static assets for the web UI.
- `docs/` contains API artifacts such as `docs/ArcPay.postman_collection.json`.
- `scripts/` holds one-off utilities like `scripts/send-money.ts`.
 - `dist/` is the TypeScript build output (generated).

## Build, Test, and Development Commands

- `npm install` installs dependencies.
- `cp .env.example .env` sets required environment variables for local use.
- `docker compose up -d` starts Redis needed by the API.
- `npm run dev` runs the local server with `tsx watch` at `http://localhost:3000`.
- `npm run build` compiles TypeScript and rewrites path aliases.

## Coding Style & Naming Conventions

- TypeScript, ESM modules, 2-space indentation, double quotes, and trailing commas in multiline lists.
- Use existing path aliases like `@/payments/api` for internal imports.
- Prefer domain-based folders under `src/` and descriptive file names (`payment-capture.db.ts`).
- No formatter/linter is configured; keep edits consistent with nearby files.

## Testing Guidelines

- No automated test runner is configured in `package.json`.
- Use the Postman collection in `docs/ArcPay.postman_collection.json` for API sanity checks.
- For manual verification, start the dev server and exercise relevant routes via the web UI or `curl`.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`, optional scopes like `feat(x402):`).
- PRs should include a concise summary, linked issues, and testing notes.
- Add screenshots or screen recordings for UI changes under `src/web`.
- Call out any environment variable, Redis, or external service changes.

## Security & Configuration Tips

- Keep secrets in `.env` and never commit credentials.
- Redis must be running locally before starting the dev server.
- Update `mcp.json` carefully; it is used by the MCP inspector tooling.
