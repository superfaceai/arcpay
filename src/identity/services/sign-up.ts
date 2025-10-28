import { z } from "zod";
import Config from "@/config";
import { ok, Result } from "@/lib";

import {
  accountId,
  Account,
  apiKeyId,
  ApiKey,
  generateApiKey,
  saveApiKey,
  saveAccount,
} from "@/identity/entities";

export const SignUpDTO = z.object({ name: z.string().min(2) });

export const signUp = async (
  dto: z.infer<typeof SignUpDTO>
): Promise<Result<ApiKey, never>> => {
  const live = Config.IS_PRODUCTION;

  const account = Account.parse({
    id: accountId(),
    type: "individual",
    name: dto.name,
  });

  const apiKey = ApiKey.parse({
    id: apiKeyId(),
    key: generateApiKey(live),
    account: account.id,
    live,
    created_at: new Date(),
  });

  await saveApiKey(apiKey);
  await saveAccount(account);

  return ok(apiKey);
};
