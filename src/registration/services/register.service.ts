import { z } from "zod";
import Config from "@/config";
import { ok, Result } from "@/lib";

import { createWallet, CircleCreateWalletError } from "@/circle";

import { Wallet, saveWallet, walletId } from "@/payments/entities";

import {
  userId,
  User,
  apiKeyId,
  ApiKey,
  generateApiKey,
  saveApiKey,
  saveUser,
} from "@/identity/entities";

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
