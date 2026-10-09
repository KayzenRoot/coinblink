FROM node:22.19.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG PUBLIC_BUILD_SHA=local
ARG PUBLIC_BUILD_ENV=local
ENV PUBLIC_BUILD_SHA=${PUBLIC_BUILD_SHA}
ENV PUBLIC_BUILD_ENV=${PUBLIC_BUILD_ENV}

RUN npm run build

FROM node:22.19.0-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV WRANGLER_SEND_METRICS=false
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/wrangler.jsonc ./wrangler.jsonc

USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["npm", "run", "preview", "--", "--ip", "0.0.0.0", "--port", "3000"]
