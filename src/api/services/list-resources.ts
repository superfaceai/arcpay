import { createApi } from "./create-api.js";

export type Resource = {
  url: string;
  methods: string[];
};

export const listResources = <App extends ReturnType<typeof createApi>>(
  app: App,
  ignoreUrls?: string[]
): Resource[] => {
  const resourceToMethods: Record<string, Set<string>> = {};

  for (const route of app.routes) {
    const resource = route.path;
    const method = route.method;

    if (!resourceToMethods[resource]) {
      resourceToMethods[resource] = new Set();
    }
    resourceToMethods[resource].add(method);
  }

  return Object.entries(resourceToMethods)
    .map(([resource, methods]) => ({
      url: resource,
      methods: Array.from(methods).sort(),
    }))
    .filter(({ methods }) => methods.length > 0)
    .filter(({ url }) => url !== "/*")
    .filter(({ url }) => !ignoreUrls?.includes(url))
    .sort((a, b) => a.url.localeCompare(b.url));
};
