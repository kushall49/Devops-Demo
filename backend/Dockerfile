# ============================================================
# BACKEND DOCKERFILE
#
# A Dockerfile is a recipe for building a Docker image.
# Each line (instruction) creates a new "layer" in the image.
#
# STAGES:
#   1. Choose base image (Node.js 18 Alpine - small Linux distro)
#   2. Set working directory
#   3. Copy and install dependencies
#   4. Copy source code
#   5. Expose port and start the server
# ============================================================

# ---- Stage 1: Use official Node.js image ----
# 'alpine' is a minimal Linux distribution (~5MB vs ~900MB for full)
FROM node:18-alpine

# ---- Stage 2: Set Working Directory ----
# All subsequent commands run from this directory inside the container
WORKDIR /app

# ---- Stage 3: Install Dependencies ----
# We copy package.json FIRST and install before copying source code.
# WHY? Docker caches each layer. If source code changes but package.json
# doesn't, Docker skips the npm install step (faster builds!).
COPY package*.json ./

# Install only production dependencies (no devDependencies)
RUN npm ci --only=production

# ---- Stage 4: Copy Source Code ----
# Copy everything else (src/, .env.example, etc.)
COPY . .

# ---- Stage 5: Set Runtime Configuration ----
# Expose port 5000 (documentation only - docker-compose handles actual binding)
EXPOSE 5000

# Tell Docker this container is a Node.js app
ENV NODE_ENV=production

# ---- Health Check ----
# Docker will ping /api/health/ping every 30s to verify the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health/ping || exit 1

# ---- Stage 6: Start Command ----
# This runs when the container starts
CMD ["node", "src/server.js"]
