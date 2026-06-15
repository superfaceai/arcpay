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

Copy `.env.example` to `.env`, fill the required secrets, and set `APP_DOMAIN` to the public hostname that should serve the app:

```env
APP_DOMAIN=arcpay.example.com
```

Then start the full stack:

```sh
npm run compose:prod:up
```

`npm run compose:prod` is also available as a shorter alias for `compose:prod:up`.

This runs Caddy on ports 80/443 with automatic HTTPS, the app internally on port 3000, Redis with append-only persistence, and the Upstash-compatible Redis HTTP proxy used by the app. Make sure DNS for `APP_DOMAIN` points to the server and ports 80/443 are open. Redis data is stored under `.storage/redis/`; Caddy certificates/config are stored under `.storage/caddy/`.

For local debugging on the host, the app is also bound to `http://127.0.0.1:3000` by default.

Production Compose shortcuts:

```sh
npm run compose:prod:up        # build and start/update the stack
npm run compose:prod:down      # stop and remove containers/network, keep .storage data
npm run compose:prod:recreate  # rebuild and force-recreate containers
npm run compose:prod:logs      # follow logs
```

Short aliases are also available:

```sh
npm run compose:prod
npm run compose:logs
npm run compose:down
```
