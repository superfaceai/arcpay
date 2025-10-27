import { Transaction as CircleTransaction } from "@circle-fin/developer-controlled-wallets";
import { client } from "../client";

export const pollCircleTransaction = async ({
  circleTxId,
  untilMatch,
  interval = 200,
  maxRetries = 5,
  thisTry = 1,
}: {
  circleTxId: string;
  untilMatch: (circleTx: CircleTransaction) => boolean;
  interval?: number;
  maxRetries?: number;
  thisTry?: number;
}): Promise<CircleTransaction | undefined> => {
  const response = await client.getTransaction({ id: circleTxId });

  if (response.data === undefined || response.data.transaction === undefined) {
    if (thisTry < maxRetries) {
      await sleep(interval);
      return pollCircleTransaction({
        circleTxId,
        untilMatch,
        interval,
        maxRetries,
        thisTry: thisTry + 1,
      });
    }
    return undefined;
  }

  const hasMatch = untilMatch(response.data.transaction);

  if (hasMatch) {
    return response.data.transaction;
  }

  if (thisTry < maxRetries) {
    await sleep(interval);
    return pollCircleTransaction({
      circleTxId,
      untilMatch,
      interval,
      maxRetries,
      thisTry: thisTry + 1,
    });
  }

  return undefined;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
