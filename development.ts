import { serve } from "@hono/node-server";
import app from "./src/app.js";

const DEFAULT_PORT = 3000;

const args = process.argv.slice(2);

const port = (() => {
  if (
    args.length === 1 &&
    !isNaN(parseInt(args[0])) &&
    parseInt(args[0]) > 0 &&
    parseInt(args[0]) <= 65535
  )
    return parseInt(args[0]);

  const portArgIx = args.findIndex((arg) => arg === "--port" || arg === "-p");
  return portArgIx !== -1 ? parseInt(args[portArgIx + 1]) : DEFAULT_PORT;
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
