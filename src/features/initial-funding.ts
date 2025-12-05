import Config from "@/config";
import { Currency } from "@/balances/values";
import { loadFeatureState, saveFeatureState } from "./entities";

const DB_STATE_KEY = "initial-funding";

type InitialFundingState = {
  amountUsdc: string;
  maxUseCount: number;
  useCount: number;
  lastUsedAt: string | null;
};

const isEnabled = () =>
  Config.FEATURE_INITIAL_FUNDING_ENABLED &&
  !!Config.FEATURE_INITIAL_FUNDING_AMOUNT_USDC &&
  typeof Config.FEATURE_INITIAL_FUNDING_MAX_USE_COUNT === "number" &&
  !!Config.FEATURE_INITIAL_FUNDING_BLOCKCHAIN &&
  !!Config.FEATURE_INITIAL_FUNDING_BLOCKCHAIN_PRIVATEKEY;

export const InitialFundingFeature = {
  isEnabled,
  canUseInitialFunding: async ({ live }: { live: boolean }) => {
    if (!isEnabled()) return false;
    const state = await loadUpdatedState({ live });

    if (state.useCount >= state.maxUseCount) return false;

    return true;
  },
  getInitialFundingSettings: () => {
    return {
      amountUsdc: Config.FEATURE_INITIAL_FUNDING_AMOUNT_USDC!,
      currency: "USDC" as Currency,
      blockchain: Config.FEATURE_INITIAL_FUNDING_BLOCKCHAIN!,
      privateKey: Config.FEATURE_INITIAL_FUNDING_BLOCKCHAIN_PRIVATEKEY!,
    };
  },
  recordUseOfInitialFunding: async ({ live }: { live: boolean }) => {
    const state = await loadUpdatedState({ live });

    const newState: InitialFundingState = {
      ...state,
      useCount: state.useCount + 1,
      lastUsedAt: new Date().toISOString(),
    };

    await saveFeatureState({
      key: DB_STATE_KEY,
      value: JSON.stringify(newState),
      live,
    });
  },
};

/**
 * Reads state of the feature from database.
 * If no state is found, creates a new one with the default settings.
 * If the state has different settings compared to the current ENV config, updates the state with the new settings.
 */
const loadUpdatedState = async ({
  live,
}: {
  live: boolean;
}): Promise<InitialFundingState> => {
  const savedFeatureState = await loadFeatureState({
    key: DB_STATE_KEY,
    live,
  });

  if (!savedFeatureState) {
    const newState: InitialFundingState = {
      amountUsdc: Config.FEATURE_INITIAL_FUNDING_AMOUNT_USDC!,
      maxUseCount: Config.FEATURE_INITIAL_FUNDING_MAX_USE_COUNT!,
      useCount: 0,
      lastUsedAt: null,
    };

    await saveFeatureState({
      key: DB_STATE_KEY,
      value: JSON.stringify(newState),
      live,
    });

    return newState;
  }

  const currentState = JSON.parse(
    savedFeatureState.value
  ) as InitialFundingState;

  const hasSameSettings =
    currentState.amountUsdc === Config.FEATURE_INITIAL_FUNDING_AMOUNT_USDC! &&
    currentState.maxUseCount === Config.FEATURE_INITIAL_FUNDING_MAX_USE_COUNT!;

  if (!hasSameSettings) {
    const newStateSettings: InitialFundingState = {
      ...currentState,
      amountUsdc: Config.FEATURE_INITIAL_FUNDING_AMOUNT_USDC!,
      maxUseCount: Config.FEATURE_INITIAL_FUNDING_MAX_USE_COUNT!,
    };

    await saveFeatureState({
      key: DB_STATE_KEY,
      value: JSON.stringify(newStateSettings),
      live,
    });

    return newStateSettings;
  }

  return currentState;
};
