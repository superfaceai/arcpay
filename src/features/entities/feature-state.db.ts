import { db } from "@/database";
import { FeatureState } from "./feature-state.entity";

const storageKey = ({ key, live }: { key: string; live: boolean }) =>
  `feature:${key}:${live ? "live" : "test"}`;

export const saveFeatureState = async (featureState: FeatureState) => {
  await db.hset(
    storageKey({
      key: featureState.key,
      live: featureState.live,
    }),
    featureState
  );
};

export const loadFeatureState = async ({
  key,
  live,
}: {
  key: string;
  live: boolean;
}): Promise<FeatureState | null> => {
  const featureState = await db.hgetall<FeatureState>(
    storageKey({ key, live })
  );

  if (!featureState) return null;

  return FeatureState.parse(featureState);
};
