import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type ToolResponseInput =
  | {
      error: string;
    }
  | { structuredContent: Record<string, any> }
  | { content: string | number | boolean | null | undefined };

export const toolResponse = (input: ToolResponseInput): CallToolResult => {
  if ("error" in input) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: input.error }),
        },
      ],
    };
  }

  if ("structuredContent" in input) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(input.structuredContent),
        },
      ],
      structuredContent: input.structuredContent,
    };
  }

  return {
    content: [
      {
        type: "text",
        text:
          typeof input.content === "string"
            ? input.content
            : JSON.stringify(input.content),
      },
    ],
    structuredContent: { content: input.content },
  };
};
