import * as z from "zod";
import { UcpConfig, UcpConfigId } from "./config";
import {
  UcpWalletPaymentInstrument,
  UcpWalletPaymentInstrumentId,
} from "./wallet-payment-instrument";
import {
  UcpMandateTokenCredential,
  UcpMandateTokenCredentialId,
} from "./mandate-token-credential";

/**
 * Registry of our UCP schemas, with configurable metadata.
 */
export const ucpSchemasRegistry = z.registry<{
  id: string;
  title?: string;
  description?: string;
  allOf?: { $ref: string }[];
}>();

/**
 * !IMPORTANT: The IDs here define the URI of the schemas in the UCP HTTP API.
 */
ucpSchemasRegistry.add(UcpConfig, {
  id: UcpConfigId,
});
ucpSchemasRegistry.add(UcpWalletPaymentInstrument, {
  id: UcpWalletPaymentInstrumentId,
});
ucpSchemasRegistry.add(UcpMandateTokenCredential, {
  id: UcpMandateTokenCredentialId,
});
