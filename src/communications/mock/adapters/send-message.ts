import { ok } from "@/lib";

import { SendMessage } from "@/communications/interfaces";

export const sendMessage: SendMessage = async ({ channelId, message }) => {
  console.error(`[MESSAGE MOCK] [CHANNEL: ${channelId}] ${message}`);
  return ok({ status: "failed" });
};
