# syntax=docker/dockerfile:1

FROM node:22-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json tsconfig.json development.ts ./
COPY src ./src
COPY scripts ./scripts
COPY public ./public
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NODE=true \
    PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "dist/development.js"]
