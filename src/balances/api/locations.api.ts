import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withAuth, withIdempotency, withValidation } from "@/api/middlewares";

import { listLocations } from "@/balances/services";
import { createLocation } from "../services/create-location";
import z from "zod";
import { Location } from "../entities";
import { Blockchain } from "../values";

export const OpenLocationDTO = z.object({
  type: Location.shape.type,
  blockchain: Blockchain,
});

export const locationsApi = createApi()
  .post(
    "/locations",
    withAuth(),
    withIdempotency(),
    withValidation("json", OpenLocationDTO),
    async (c) => {
      const accountId = c.get("accountId");
      const live = c.get("isLive");
      const blockchain = c.req.valid("json").blockchain;

      const createLocationResult = await createLocation({
        accountId,
        live,
        blockchain,
      });

      if (!createLocationResult.ok) {
        return ProblemJson(
          c,
          500,
          "Error creating wallet on blockchain",
          createLocationResult.error.message
        );
      }

      return c.json(ApiObject("location", createLocationResult.value), {
        status: 201,
      });
    }
  )
  .get("/locations", withAuth(), async (c) => {
    const locations = await listLocations({
      accountId: c.get("accountId"),
      live: c.get("isLive"),
    });

    if (!locations.ok)
      return ProblemJson(
        c,
        500,
        "Error accessing blockchain",
        locations.error.message
      );

    return c.json(ApiList("location", locations.value));
  })
  .get("/locations/:locationId", withAuth(), async (c) => {
    const locations = await listLocations({
      accountId: c.get("accountId"),
      live: c.get("isLive"),
      locationIds: [c.req.param("locationId")],
    });

    if (!locations.ok)
      return ProblemJson(
        c,
        500,
        "Error accessing blockchain",
        locations.error.message
      );

    if (locations.value.length === 0)
      return ProblemJson(c, 404, "Not Found", "Location not found");

    return c.json(ApiObject("location", locations.value[0]));
  });
