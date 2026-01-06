import { db, Pipeline } from "@/database";
import { BridgeTransfer } from "./bridge-transfer.entity";
import { bridgeTransferSortDesc } from "./bridge-transfer.entity";

const storageKeyById = ({
  id,
  live,
  accountId,
}: {
  id: string;
  live: boolean;
  accountId: string;
}) => `btx:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `btxs:${accountId}:${live ? "live" : "test"}`;

const saveBridgeTransferViaPipeline = ({
  bridgeTransfer,
  accountId,
  pipeline,
}: {
  bridgeTransfer: BridgeTransfer;
  accountId: string;
  pipeline: Pipeline;
}) => {
  pipeline.hset(
    storageKeyById({
      id: bridgeTransfer.id,
      live: bridgeTransfer.live,
      accountId,
    }),
    bridgeTransfer
  );
  pipeline.zadd(storageKeyByAccount({ accountId, live: bridgeTransfer.live }), {
    score: bridgeTransfer.created_at.getTime(),
    member: bridgeTransfer.id,
  });

  return pipeline;
};

export const saveBridgeTransfer = async ({
  bridgeTransfer,
  accountId,
}: {
  bridgeTransfer: BridgeTransfer;
  accountId: string;
}) => {
  const pipeline = db.multi();
  saveBridgeTransferViaPipeline({ bridgeTransfer, accountId, pipeline });
  await pipeline.exec();
  return bridgeTransfer;
};

export const loadBridgeTransferById = async ({
  accountId,
  bridgeTransferId,
  live,
}: {
  accountId: string;
  bridgeTransferId: string;
  live: boolean;
}): Promise<BridgeTransfer | null> => {
  const bridgeTransfer = await db.hgetall<BridgeTransfer>(
    storageKeyById({ id: bridgeTransferId, live, accountId })
  );

  if (!bridgeTransfer) {
    return null;
  }

  return BridgeTransfer.parse(bridgeTransfer);
};

export const loadBridgeTransfersByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<BridgeTransfer[]> => {
  const bridgeTransferIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const bridgeTransfers = await Promise.all(
    bridgeTransferIds.map((bridgeTransferId) =>
      loadBridgeTransferById({ accountId, bridgeTransferId, live })
    )
  );

  return bridgeTransfers
    .filter((bridgeTransfer) => bridgeTransfer !== null)
    .sort(bridgeTransferSortDesc);
};

export const eraseBridgeTransfersForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const eraseBridgeTransfers = async ({ live }: { live: boolean }) => {
    const bridgeTransferIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const bridgeTransferId of bridgeTransferIds) {
      pipeline.del(storageKeyById({ id: bridgeTransferId, live, accountId }));
      console.debug(
        `Removing Bridge Transfer '${bridgeTransferId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await eraseBridgeTransfers({ live: true });
  await eraseBridgeTransfers({ live: false });

  console.debug(`Removed Bridge Transfers for Account '${accountId}'`);
};
