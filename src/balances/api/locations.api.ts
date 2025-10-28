import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withAuth } from "@/api/middlewares";

import { listLocations } from "@/balances/services";

export const locationsApi = createApi()
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
