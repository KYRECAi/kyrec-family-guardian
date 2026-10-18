# Keep builds and final images on the same libc for native dependencies.
FROM node:24-alpine3.24 AS base
RUN apk upgrade --no-cache

FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN NITRO_PRESET=node-server npm run build

FROM base AS migration-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Neither deployed entrypoint invokes a package manager. Remove its executable
# and dependency tree, not scanner metadata or vulnerability findings.
FROM base AS release-base
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /opt/yarn* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx

FROM release-base AS migration
ARG GUARDIAN_SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$GUARDIAN_SOURCE_COMMIT
ENV NODE_ENV=production
ENV GUARDIAN_RUNTIME_MODE=production
ENV GUARDIAN_SOURCE_COMMIT=$GUARDIAN_SOURCE_COMMIT
WORKDIR /app
COPY --from=migration-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node scripts/migrate.mjs scripts/migration-plan.mjs ./scripts/
COPY --chown=node:node migrations ./migrations
USER node
CMD ["node", "scripts/migrate.mjs"]

FROM release-base AS runtime
ARG GUARDIAN_SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$GUARDIAN_SOURCE_COMMIT
ENV NODE_ENV=production
ENV GUARDIAN_RUNTIME_MODE=production
ENV GUARDIAN_SOURCE_COMMIT=$GUARDIAN_SOURCE_COMMIT
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/scripts/start-production.mjs ./scripts/start-production.mjs
COPY --from=build --chown=node:node /app/src/lib/runtime-config.server.ts ./src/lib/runtime-config.server.ts
USER node
EXPOSE 8080
CMD ["node", "scripts/start-production.mjs"]
