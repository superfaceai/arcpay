import { z } from "zod";
import Config from "@/config/index.js";
import { ok, Result } from "@/lib/index.js";

import {
  userId,
  User,
  apiKeyId,
  ApiKey,
  generateApiKey,
  saveApiKey,
  saveUser,
} from "@/identity/entities/index.js";

export const SignUpDTO = z.object({ name: z.string().min(2) });

export const signUp = async (
  dto: z.infer<typeof SignUpDTO>
): Promise<Result<ApiKey, never>> => {
  const live = Config.IS_PRODUCTION;

  const user = User.parse({
    id: userId(),
    name: dto.name,
  });

  const apiKey = ApiKey.parse({
    id: apiKeyId(),
    key: generateApiKey(live),
    user: user.id,
    live,
    created_at: new Date(),
  });

  await saveApiKey(apiKey);
  await saveUser(user);

  return ok(apiKey);
};
