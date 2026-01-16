import { createApi } from "@/api/services";
import { ArcPayPlatformProfilePath, getArcPayPlatformProfile } from "../values";

export const ucpCheckoutsProfileApi = createApi().get(
  ArcPayPlatformProfilePath,
  (c) => {
    const baseUrl = c.req.url.split("?")[0];
    const profile = getArcPayPlatformProfile({ baseUrl });

    return c.text(JSON.stringify(profile, null, 2), 200, {
      "content-type": "application/schema+json",
    });
  }
);
