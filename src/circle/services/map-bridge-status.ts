import { BridgeResult } from "@circle-fin/bridge-kit";
import { BridgeTransfer } from "@/payments/entities";

export const mapBridgeStatus = (
  status: BridgeResult["state"]
): BridgeTransfer["status"] => {
  if (status === "pending") return "retrying";
  if (status === "success") return "succeeded";
  if (status === "error") return "failed";
  throw new Error(`Unknown status: ${status}`);
};
