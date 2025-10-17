import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import Config from "@/config";

export const client = initiateDeveloperControlledWalletsClient({
  apiKey: Config.CIRCLE_API_KEY,
  entitySecret: Config.CIRCLE_ENTITY_SECRET,
});
