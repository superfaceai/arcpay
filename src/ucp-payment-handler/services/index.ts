import { PaymentHandlerResponse } from "@/ucp/interfaces";
import {
  UcpConfig,
  UcpConfigId,
  UcpHandler,
  UcpWalletPaymentInstrumentId,
} from "../values";

export const getPathToSchema = (schemaFile: string) => {
  return `/ucp/schemas/${schemaFile}`;
};

export const getSchemaFilename = (schemaId: string) => {
  return `${schemaId}.json`;
};

export const getPaymentHandlerSpecPath = () =>
  "/ucp/guides/arcpay-payment-handler";

export const getPaymentHandlerObject = ({
  hostUrl,
  handlerId = "arcpay",
  config,
}: {
  hostUrl: string;
  handlerId?: string;
  config?: UcpConfig;
}): PaymentHandlerResponse => {
  const specPath = getPaymentHandlerSpecPath();
  const configSchemaPath = getPathToSchema(getSchemaFilename(UcpConfigId));
  const instrumentSchemaPath = getPathToSchema(
    getSchemaFilename(UcpWalletPaymentInstrumentId)
  );

  return {
    id: handlerId,
    name: UcpHandler.name,
    version: UcpHandler.version,
    spec: new URL(specPath, hostUrl).toString(),
    config_schema: new URL(configSchemaPath, hostUrl).toString(),
    instrument_schemas: [new URL(instrumentSchemaPath, hostUrl).toString()],
    ...(config ? { config } : {}),
  };
};
