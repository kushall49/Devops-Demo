# ============================================================
# FRONTEND DOCKERFILE (Next.js)
#
# Uses a multi-stage build for smaller final image:
#   Stage 1 (deps)    - Install dependencies
#   Stage 2 (builder) - Build the Next.js app
#   Stage 3 (runner)  - Run only the built output (tiny image)
# ============================================================

# ---- Stage 1: Install dependencies ----
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Stage 2: Build the application ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set the backend URL for the build
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy what's needed to run the app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
