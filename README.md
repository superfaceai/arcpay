# Agent Pay

**Agent Pay** is a safe, easy way for your AI agents to pay for physical or digital goods and services — autonomously, but on your terms.

Agent Pay supports the following payment methods:
- Credit Card (soon)
- USDC payment (soon)

## How to use (docs)

- See server root path ([GET /](https://pay.superface.dev/))
- Use included [Postman collection](./docs/AgentPay.postman_collection.json)
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

Then run the development server

```sh
npm run dev
```

The local development server should be running on port 3000.

```sh
open http://localhost:3000
```
