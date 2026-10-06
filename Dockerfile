FROM node:24-slim AS builder

RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
ARG ORIGIN=http://localhost:3000
ENV ORIGIN=$ORIGIN
RUN pnpm build

FROM node:24-slim AS runner

RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm rebuild better-sqlite3

COPY --from=builder /app/build ./build
COPY drizzle ./drizzle

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/svelteforge.db
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "build/index.js"]
