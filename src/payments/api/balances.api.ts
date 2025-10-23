import { z } from "zod";

import { createApi } from "@/api/services";
import { ApiObject, ApiList } from "@/api/values";
import { withAuth, withValidation } from "@/api/middlewares";

import { getBalance, listBalances } from "@/payments/services";

import { Currency } from "@/payments/values";
import { getOrThrow } from "@/lib";

export const balancesApi = createApi()
  .get("/balances", withAuth(), async (c) => {
    const balancesResult = await listBalances({
      userId: c.get("userId"),
      live: c.get("isLive"),
    });

    return c.json(ApiList("balance", getOrThrow(balancesResult)));
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
        userId: c.get("userId"),
        live: c.get("isLive"),
        currency,
      });

      return c.json(ApiObject("balance", getOrThrow(balanceResult)));
    }
  );
