FROM node:22-alpine AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_CRM_API_BASE
ARG NEXT_PUBLIC_MEDIA_ORIGINS
ARG NEXT_PUBLIC_APP_ENV=production
ARG NEXT_PUBLIC_APP_RELEASE=unknown
ARG NEXT_PUBLIC_TELEMETRY_ENABLED=false
ENV NEXT_PUBLIC_CRM_API_BASE=$NEXT_PUBLIC_CRM_API_BASE
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
ENV PORT=3001
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
