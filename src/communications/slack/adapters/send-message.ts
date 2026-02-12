import { err, ok } from "@/lib";

import { SendMessage } from "@/communications/interfaces";
import { sendMessage as mockSendMessage } from "@/communications/mock/adapters";
import { client } from "../client";

export const sendMessage: SendMessage = async ({ channelId, message }) => {
  if (!client) return mockSendMessage({ channelId, message });

  try {
    const res = await client.chat.postMessage({
      channel: channelId,
      text: message,
    });

    if (!res.ok)
      return err({
        type: "MessageError",
        message: `Failed to send message: ${res.error || res.errors?.[0] || "Unknown error"}`,
      });

    return ok({ status: "sent" });
  } catch (error) {
    return err({
      type: "MessageError",
      message: String(error),
    });
  }
};
