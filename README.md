# Arc Pay

**Arc Pay** is a safe, easy way for your AI agents to pay for physical or digital goods and services — autonomously, but on your terms.

Arc Pay supports the following payment methods:
- USDC payment
- Credit Card (soon)

## How to use (docs)

- See [reference](https://arcpay.ai/docs/api)
- Use included [Postman collection](./docs/ArcPay.postman_collection.json)
- Use `npm run mcp:inspect` to interact with MCP server

## Development

First install the dependencies.

```sh
npm install
```

Set the necessary environment variables.

```sh
cp .env.example .env
```

Start the local Redis instance using Docker Compose.

```sh
docker compose up -d
```

Then run the development server

```sh
npm run dev
```

The local development server should be running on port 3000.

```sh
open http://localhost:3000
```
