import { z } from "zod";

import { getOrThrow } from "@/lib";

import { createApi } from "@/api/services";
import { ApiObject, ApiList, ProblemJson } from "@/api/values";
import { withAuth, withValidation } from "@/api/middlewares";

import { getBalance, listBalances } from "@/balances/services";
import { Currency } from "@/balances/values";

export const balancesApi = createApi()
  .get("/balances", withAuth(), async (c) => {
    const balancesResult = await listBalances({
      accountId: c.get("accountId"),
      live: c.get("isLive"),
    });

    if (!balancesResult.ok)
      return ProblemJson(
        c,
        500,
        "Error accessing blockchain",
        balancesResult.error.message
      );

    if (balancesResult.value.length === 0)
      return c.json(
        ApiList("balance", [
          {
            id: "usdc",
            owner: c.get("accountId"),
            live: c.get("isLive"),
            currency: "USDC",
            amount: "0",
            locations: [],
          },
        ])
      );

    return c.json(ApiList("balance", balancesResult.value));
  })
  .get(
    "/balances/:currency",
    withAuth(),
    withValidation(
      "param",
      z.object({
        currency: z
          .string()
          .transform((val) => val.toUpperCase())
          .pipe(Currency),
      })
    ),
    async (c) => {
      const currency: Currency = c.req.valid("param").currency;

      const balanceResult = await getBalance({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        currency,
      });

      const foundBalance = getOrThrow(balanceResult);

      if (!foundBalance)
        return c.json(
          ApiObject("balance", {
            id: currency.toLowerCase(),
            owner: c.get("accountId"),
            live: c.get("isLive"),
            currency,
            amount: "0",
            locations: [],
          })
        );

      return c.json(ApiObject("balance", foundBalance));
    }
  );
