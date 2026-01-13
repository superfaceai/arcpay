import Config from "@/config";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

export const circleWalletsAdapter = createCircleWalletsAdapter({
  apiKey: Config.CIRCLE_API_KEY,
  entitySecret: Config.CIRCLE_ENTITY_SECRET,
});
