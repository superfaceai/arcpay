import { deepTransform } from "./deep-transform";

const BIGINT_TAG = "<bigint>";

export function withBigIntSerialization<V>(value: V): V {
  return deepTransform(
    value,
    (v) => typeof v === "bigint",
    (b) => BIGINT_TAG + (b as bigint).toString()
  );
}

export function withBigIntDeserialization<V>(value: V): V {
  return deepTransform(
    value,
    (v) => typeof v === "string" && v.startsWith(BIGINT_TAG),
    (v) => BigInt((v as string).slice(BIGINT_TAG.length))
  );
}
