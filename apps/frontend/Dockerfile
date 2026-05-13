# Stage 1 — Builder
# Bun on Alpine — has everything needed to build frontend
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy root package.json and lockfile first — cached layer
# Build context is monorepo root — needed for packages/
COPY package.json bun.lock ./

# Copy workspace package.json files — needed for bun to resolve workspaces
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/
COPY turbo.json ./
COPY tsconfig.json ./

# Install all dependencies — cached until package.json or bun.lock changes
RUN bun install
RUN ls /app/node_modules/.bin/ | grep tsc

# Build packages in correct order via turbo
# zod → openapi → frontend
RUN bunx turbo run build --filter=@tasker/zod
RUN bunx turbo run build --filter=@tasker/openapi
RUN bunx turbo run build --filter=frontend

# Stage 2 — Runner
# nginx serves static files — no Node/Bun needed at runtime
FROM nginx:alpine

# Copy built static files from Stage 1
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config — handles React Router (single page app routing)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]