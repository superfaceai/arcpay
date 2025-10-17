import { ObjectName, ExpectedObject } from "./api-objects.js";

type ApiObject<Name extends ObjectName, O extends object> = O & {
  object: Name;
};

type ApiList<ItemName extends ObjectName, O extends object> = {
  object: "list";
  data: Array<ApiObject<ItemName, O>>;
};

export const ApiObject = <N extends ObjectName>(
  objectName: N,
  data: ExpectedObject<N>
): ApiObject<N, ExpectedObject<N>> =>
  Object.assign({ object: objectName }, data);

export const ApiList = <N extends ObjectName>(
  objectName: N,
  data: Array<ExpectedObject<N>>
): ApiList<N, ExpectedObject<N>> => ({
  object: "list",
  data: data.map((item) => ApiObject(objectName, item)),
});
