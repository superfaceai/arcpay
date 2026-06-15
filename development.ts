import { serve } from "@hono/node-server";
import app from "./src/app.js";

const DEFAULT_PORT = 3000;

const args = process.argv.slice(2);

const parsePort = (value: string | undefined) => {
  if (value === undefined) return undefined;

  const port = parseInt(value);
  return !isNaN(port) && port > 0 && port <= 65535 ? port : NaN;
};

const port = (() => {
  const positionalPort = parsePort(args.length === 1 ? args[0] : undefined);
  if (positionalPort !== undefined) return positionalPort;

  const portArgIx = args.findIndex((arg) => arg === "--port" || arg === "-p");
  if (portArgIx !== -1) return parsePort(args[portArgIx + 1]) ?? NaN;

  return parsePort(process.env.PORT) ?? DEFAULT_PORT;
})();

if (isNaN(port)) {
  console.error("-- INVALID PORT: ", port);
  console.error("-- USAGE");
  console.error("   npm run dev -p 3000");
  process.exit(1);
}

console.info(`--- DEVELOPMENT SERVER -----`);
console.info(`    http://localhost:${port}`);
console.info(`----------------------------`);

serve({
  fetch: app.fetch,
  port,
});
