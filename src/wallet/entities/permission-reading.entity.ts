import { z } from "zod";
import { generateId } from "@/lib";

export const permissionReadToken = () => generateId("i_have_read_permissions");

export const PermissionReading = z.object({
  permissionToken: z
    .string()
    .describe(
      "The permission token you need to use to interact with the wallet."
    ),
  permissionExpirationMinutes: z
    .number()
    .describe("The number of minutes until the permission token expires."),
  permissions: z.array(z.string()),
});
export type PermissionReading = z.infer<typeof PermissionReading>;
