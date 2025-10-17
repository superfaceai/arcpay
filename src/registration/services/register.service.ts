import { z } from "zod";
import Config from "@/config/index.js";
import { ok, Result } from "@/lib/index.js";

import { createWallet, CircleCreateWalletError } from "@/circle/index.js";

import { Wallet, saveWallet, walletId } from "@/payments/entities/index.js";

import {
  userId,
  User,
  apiKeyId,
  ApiKey,
  generateApiKey,
  saveApiKey,
  saveUser,
} from "@/identity/entities/index.js";

export const RegisterDTO = z.object({ name: z.string().min(2) });

export const register = async (
  dto: z.infer<typeof RegisterDTO>
): Promise<Result<ApiKey, CircleCreateWalletError>> => {
  // TODO: Create both live and test API keys/wallets
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

  const selectedBlockchain = Config.DEFAULT_BLOCKCHAIN;

  const circleWallet = await createWallet({
    blockchain: selectedBlockchain,
    live,
  });

  if (!circleWallet.ok) return circleWallet;

  const primaryWallet = Wallet.parse({
    id: walletId(),
    owner: user.id,
    address: circleWallet.value.address,
    blockchain: selectedBlockchain,
    live,
    issuer: "circle",
    circle: {
      id: circleWallet.value.id,
      state: circleWallet.value.state,
      network: circleWallet.value.blockchain,
    },
    created_at: new Date(circleWallet.value.createDate),
  });

  await saveWallet(primaryWallet);
  await saveApiKey(apiKey);
  await saveUser(user);

  return ok(apiKey);
};
