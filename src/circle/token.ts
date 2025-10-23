import { Result, tryAsync } from "@/lib";
import { client } from "./client.js";
import { CircleLookupTokenError } from "./errors.js";
import { isValidToken, Token } from "@/payments/values";

export const circleTokenIdToToken = async (tokenId: string): Promise<Token> => {
  const cachedToken = CIRCLE_TOKEN_IDS[tokenId];
  if (cachedToken) {
    return cachedToken;
  }

  const token = await lookupToken(tokenId);

  if (!token.ok) {
    throw new Error(token.error.message);
  }

  CIRCLE_TOKEN_IDS[tokenId] = token.value; // doesn't persist anyways
  return token.value;
};

export const lookupToken = async (
  tokenId: string
): Promise<Result<Token, CircleLookupTokenError>> =>
  tryAsync(
    async () => {
      const token = await client.getToken({
        id: tokenId,
      });

      if (!token.data) {
        throw new Error("Token not found");
      }

      const symbol = token.data.token?.symbol;

      if (!isValidToken(symbol)) {
        throw new Error(`Invalid token symbol: ${symbol}`);
      }

      return symbol as Token;
    },
    (error) => ({
      type: "CircleLookupTokenError",
      message: String(error),
    })
  );

const CIRCLE_TOKEN_IDS: { [key: string]: Token } = {
  // Aptos
  "298eebe2-3131-5183-b528-f925f70848d0": "USDC",
  "e3cbdafc-42c3-58cc-ae4c-b31dbb10354c": "USDC",

  // Arbitrum
  "c87ffcb4-e2cf-5e67-84c6-388c965d2a66": "USDC",
  "4b8daacc-5f47-5909-a3ba-30d171ebad98": "USDC",

  // Avalanche
  "7efdfdbf-1799-5089-a588-31beb97ba755": "USDC",
  "ff47a560-9795-5b7c-adfc-8f47dad9e06a": "USDC",

  // Base
  "915ce944-32df-5df5-a6b1-daa9b5069f96": "USDC",
  "bdf128b4-827b-5267-8f9e-243694989b5f": "USDC",
  "f2ab11ae-53fa-5373-86e5-8b38447b65fb": "ETH-SEPOLIA",

  // Ethereum
  "b037d751-fb22-5f0d-bae6-47373e7ae3e3": "USDC",
  "5797fbd6-3795-519d-84ca-ec4c5f80c3b1": "USDC",

  // Polygon
  "db6905b9-8bcd-5537-8b08-f5548bdf7925": "USDC",
  "36b6931a-873a-56a8-8a27-b706b17104ee": "USDC",
  "0c8f8485-f74f-5e28-80f2-3cc4e80ef71c": "POL-AMOY",

  // Solana
  "33ca4ef6-2500-5d79-82bf-e3036139cc29": "USDC",
  "8fb3cadb-0ef4-573d-8fcd-e194f961c728": "USDC",
};
