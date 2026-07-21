FROM node:22-alpine AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG BASE_API_PUBLIC
ARG NEXT_PUBLIC_BASE_API_PUBLIC
ARG NEXT_PUBLIC_MEDIA_ORIGINS
ARG NEXT_PUBLIC_APP_ENV=production
ARG NEXT_PUBLIC_APP_RELEASE=unknown
ARG NEXT_PUBLIC_TELEMETRY_ENABLED=false
ENV BASE_API_PUBLIC=$BASE_API_PUBLIC
ENV NEXT_PUBLIC_BASE_API_PUBLIC=$NEXT_PUBLIC_BASE_API_PUBLIC
ENV NEXT_PUBLIC_MEDIA_ORIGINS=$NEXT_PUBLIC_MEDIA_ORIGINS
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_RELEASE=$NEXT_PUBLIC_APP_RELEASE
ENV NEXT_PUBLIC_TELEMETRY_ENABLED=$NEXT_PUBLIC_TELEMETRY_ENABLED
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/ru').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
