import { z } from "zod";
import Config from "@/config";
import { err, ok, PhoneNumber, Result } from "@/lib";

import {
  accountId,
  Account,
  apiKeyId,
  ApiKey,
  generateApiKey,
  saveApiKey,
  saveAccount,
  AccountHandle,
  loadAccountByHandle,
  loadPhoneVerification,
  ContactPhone,
  contactId,
} from "@/identity/entities";
import {
  AccountHandleNotAvailableError,
  PhoneVerificationError,
} from "@/identity/errors";

export const SignUpDTO = z.object({
  name: z.string().min(3),
  handle: AccountHandle.optional(),
  phone: z
    .object({
      number: PhoneNumber,
      verification_secret: z.string().min(64),
    })
    .optional(),
});

export const signUp = async (
  dto: z.infer<typeof SignUpDTO>
): Promise<
  Result<ApiKey, AccountHandleNotAvailableError | PhoneVerificationError>
> => {
  const live = Config.IS_PRODUCTION;

  if (dto.phone) {
    const phoneVerification = await loadPhoneVerification(dto.phone.number);

    if (
      !phoneVerification ||
      phoneVerification.secret !== dto.phone.verification_secret
    )
      return err({
        type: "PhoneVerificationError",
        message: "Phone verification is invalid or has expired",
      });
  }

  const handleResult = await getAccountHandle({
    name: dto.name,
    providedHandle: dto.handle,
  });
  if (!handleResult.ok) return handleResult;

  const account = Account.parse({
    id: accountId(),
    type: "individual",
    name: dto.name,
    handle: handleResult.value,
    contacts: dto.phone
      ? [
          ContactPhone.parse({
            id: contactId(),
            method: "phone",
            label: "Primary",
            phone_number: dto.phone.number,
            verified: true,
          }),
        ]
      : [],
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

const isHandleAvailable = async (handle: AccountHandle): Promise<boolean> => {
  const existingAccount = await loadAccountByHandle(handle);
  return !existingAccount;
};

const getAccountHandle = async ({
  name,
  providedHandle,
}: {
  name: string;
  providedHandle?: AccountHandle;
}): Promise<Result<AccountHandle, AccountHandleNotAvailableError>> => {
  if (providedHandle) {
    if (await isHandleAvailable(providedHandle)) return ok(providedHandle);
    return err({
      type: "AccountHandleNotAvailableError",
      handle: providedHandle,
    });
  }

  const handleBase = nameToHandle(name);
  if (!handleBase.ok) return handleBase;

  if (await isHandleAvailable(handleBase.value)) return ok(handleBase.value);

  let attempts = 5;
  let handleCandidate: AccountHandle;

  while (attempts > 0) {
    const randomNumber = Math.floor(Math.random() * 1000);
    handleCandidate = `${handleBase.value}_${randomNumber}`;
    if (await isHandleAvailable(handleCandidate)) return ok(handleCandidate);
    attempts--;
  }

  return err({
    type: "AccountHandleNotAvailableError",
    handle: handleBase.value,
  });
};

const nameToHandle = (
  name: string
): Result<AccountHandle, AccountHandleNotAvailableError> => {
  const sanitizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();

  const handleCandidate = sanitizedName.replace(/\s+/g, "_");

  const validatedHandle = AccountHandle.safeParse(handleCandidate);

  if (!validatedHandle.success) {
    return err({
      type: "AccountHandleNotAvailableError",
      handle: handleCandidate,
    });
  }

  return ok(validatedHandle.data);
};
