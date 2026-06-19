FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (full install — prisma CLI lives in devDependencies
# and is required by `npx prisma generate` below)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads dir
RUN mkdir -p uploads

EXPOSE 3001

# Run migrations + seed on first start, then start app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/utils/seed.js && node src/index.js"]
