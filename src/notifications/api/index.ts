import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withAuth, withIdempotency, withValidation } from "@/api/middlewares";

import {
  addNotificationRule,
  AddNotificationRuleDTO,
} from "@/notifications/services";
import {
  deleteNotificationRule,
  loadNotificationRulesByAccount,
  loadNotificationsByAccount,
} from "@/notifications/entities";
import z from "zod";
import { DateCodec } from "@/lib";

export const notificationsApi = createApi()
  .get("/notification_rules", withAuth(), async (c) => {
    const result = await loadNotificationRulesByAccount({
      live: c.get("isLive"),
      accountId: c.get("accountId"),
    });

    return c.json(ApiList("notification_rule", result));
  })
  .post(
    "/notification_rules",
    withAuth(),
    withIdempotency(),
    withValidation("json", AddNotificationRuleDTO),
    async (c) => {
      const result = await addNotificationRule({
        live: c.get("isLive"),
        accountId: c.get("accountId"),
        dto: c.req.valid("json"),
      });

      if (!result.ok) {
        return ProblemJson(c, 400, "Bad Request", result.error.message);
      }

      return c.json(ApiObject("notification_rule", result.value), {
        status: 201,
      });
    }
  )
  .delete("/notification_rules/:notificationRuleId", withAuth(), async (c) => {
    await deleteNotificationRule({
      live: c.get("isLive"),
      accountId: c.get("accountId"),
      id: c.req.param("notificationRuleId"),
    });

    return c.newResponse(null, 204);
  })
  .get(
    "/notifications",
    withAuth(),
    withValidation(
      "query",
      z.object({
        from: DateCodec.optional(),
        to: DateCodec.optional(),
      })
    ),
    async (c) => {
      const notifications = await loadNotificationsByAccount({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        from: c.req.valid("query").from,
        to: c.req.valid("query").to,
      });

      return c.json(ApiList("notification", notifications));
    }
  );
