import { SendMessage } from "@/communications/interfaces";
import { sendMessage as mockSendMessage } from "@/communications/mock/adapters";
import { client as slackClient } from "@/communications/slack/client";
import { sendMessage as sendMessageViaSlack } from "@/communications/slack/adapters";

export const sendMessage: SendMessage = async ({ channelId, message }) => {
  if (slackClient) return sendMessageViaSlack({ channelId, message });
  return mockSendMessage({ channelId, message });
};
