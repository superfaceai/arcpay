import { SendMessage } from "@/communications/interfaces";
import { sendMessage } from "@/communications/adapters";

import { SignUpNotificationFeature } from "@/features/signup-notification";
import { Account } from "@/identity/entities";
import { sendMessage as sendMessageMock } from "@/communications/mock/adapters";

export const sendSignUpNotification = async (
  account: Account,
  sendMessageAdapter: SendMessage = sendMessage,
  sendMessageMockAdapter: SendMessage = sendMessageMock,
): Promise<void> => {
  if (!SignUpNotificationFeature.isEnabled()) return;

  const contact =
    account.contacts.find((contact) => contact.method === "email")?.email! ||
    account.contacts.find((contact) => contact.method === "phone")
      ?.phone_number!;

  const message = `User ${contact} (${account.id}) signed-up to arcpay.ai (Arc Pay) 🎉`;

  const res = await sendMessageAdapter({
    channelId: SignUpNotificationFeature.getChannelId(),
    message,
  });

  if (!res.ok) {
    console.error(
      `Failed to send sign-up notification: ${JSON.stringify(res.error)}`,
    );
  }

  if (!res.ok || res.value.status !== "sent") {
    await sendMessageMockAdapter({
      channelId: SignUpNotificationFeature.getChannelId(),
      message,
    });
  }

  return;
};
