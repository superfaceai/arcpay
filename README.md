# Arc Pay

**Arc Pay** is a safe, easy way for your AI agents to pay for physical or digital goods and services — autonomously, but on your terms.

Arc Pay supports the following payment methods:
- USDC payment
- Credit Card (soon)

## How to use (docs)

- See [reference](https://arcpay.ai/docs/api)
- x402 MCP docs are included in the API reference (`/docs/api`, section "x402 Payments (MCP)")
- Use included [Postman collection](./docs/ArcPay.postman_collection.json)
- Use `npm run mcp:inspect` to interact with MCP servers (for x402, target `/x402`)

## Development

First install the dependencies.

```sh
npm install
```

Set the necessary environment variables.

```sh
cp .env.example .env
```

Start the local Redis instance and Redis HTTP proxy using Docker Compose.

```sh
npm run compose:dev
```

Then run the development server

```sh
npm run dev
```

The local development server should be running on port 3000.

```sh
open http://localhost:3000
```

## Self-host with Docker

Copy `.env.example` to `.env` and fill the required secrets. For login emails with Unosend, set `UNOSEND_API_KEY` and a verified sender in `UNOSEND_FROM_EMAIL`.

If the server already has a reverse proxy on ports 80/443, build and start the core stack, then point that proxy at `http://127.0.0.1:3000`:

```sh
npm run prod:app:build
npm run prod:app:up
```

If you want the bundled Caddy reverse proxy instead, make sure ports 80/443 are free, set `APP_DOMAIN`, start the core stack, then start the proxy:

```env
APP_DOMAIN=arcpay.example.com
```

```sh
npm run prod:app:build
npm run prod:app:up
npm run prod:proxy:up
```

This runs the app internally on port 3000, Redis with append-only persistence, and the Upstash-compatible Redis HTTP proxy used by the app. Redis data is stored under `.storage/redis/`. With the bundled Caddy profile, Caddy serves ports 80/443 with automatic HTTPS and stores certificates/config under `.storage/caddy/`.

For local debugging on the host, the app is bound to `http://127.0.0.1:3000` by default.

Production commands:

```sh
npm run prod:app:build        # build the app image
npm run prod:app:build:plain  # build the app image with detailed output
npm run prod:app:up           # start/update Redis, Redis HTTP proxy, and app
npm run prod:app:recreate     # force-recreate core containers without rebuilding
npm run prod:app:down         # stop and remove containers/network, keep .storage data
npm run prod:app:logs         # follow core stack logs

npm run prod:proxy:up         # start bundled Caddy proxy
npm run prod:proxy:down       # stop/remove bundled Caddy proxy only
npm run prod:proxy:logs       # follow Caddy logs
```
