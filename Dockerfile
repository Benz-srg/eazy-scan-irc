# EazyScan web (Next.js) — multi-stage build
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# skip the postinstall "prisma generate" until schema is present, then run it
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm exec prisma generate

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm exec prisma generate && pnpm build

FROM base AS run
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/lib/server/assets ./src/lib/server/assets
COPY --from=build /app/CONTEXT.md ./CONTEXT.md
COPY --from=build /app/SKILLS.md ./SKILLS.md
EXPOSE 3000
CMD ["pnpm", "start"]
