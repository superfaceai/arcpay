export const getPathToSchema = (schemaFile: string) => {
  return `/ucp/schemas/${schemaFile}`;
};

export const getSchemaFilename = (schemaId: string) => {
  return `${schemaId}.json`;
};
