import Config from "@/config";
import { WebClient } from "@slack/web-api";

export const client = Config.SLACK_BOT_TOKEN
  ? new WebClient(Config.SLACK_BOT_TOKEN)
  : undefined;
