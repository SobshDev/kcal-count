# syntax=docker/dockerfile:1

FROM oven/bun:1.3.5-alpine AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS build
WORKDIR /app

COPY . .

# These values are public and are embedded into the browser bundle by Vite.
ARG VITE_CONVEX_URL
ARG CLERK_PUBLISHABLE_KEY
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}

RUN test -n "$VITE_CONVEX_URL"
RUN test -n "$CLERK_PUBLISHABLE_KEY"
RUN bun run build

FROM oven/bun:1.3.5-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist

USER bun
EXPOSE 3000

CMD ["bun", "run", "start"]
