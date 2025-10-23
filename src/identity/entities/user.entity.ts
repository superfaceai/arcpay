import { generateId } from "@/lib";
import { z } from "zod";

export const userId = () => generateId("usr");

export const User = z.object({
  id: z.string(),
  name: z.string(),
});
export type User = z.infer<typeof User>;
