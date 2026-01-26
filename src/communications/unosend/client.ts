import Config from "@/config";

const makeUnosendClient = (apiKey: string) => {
  const baseUrl = "https://www.unosend.co/api/v1";

  return {
    post: async (path: string, body: Record<string, any>) => {
      const url = `${baseUrl}${path}`;

      return await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      });
    },
  }
}

export const client =
  Config.UNOSEND_API_KEY
    ? makeUnosendClient(Config.UNOSEND_API_KEY)
    : undefined;

export type UnosendMessageResult = {
  id: string;
  to: string;
  status: "sent" | "failed" | "queued";
  message_id: string;
  segments: number;
  error?: string;
};