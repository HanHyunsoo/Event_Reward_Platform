# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/

RUN npm install
RUN npm run build:all
RUN npm prune --production

# api-gateway 스테이지
FROM node:18-alpine AS api-gateway

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/api-gateway/main.js ./main.js

CMD ["node", "main.js"]

# users 스테이지
FROM node:18-alpine AS users

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/users/main.js ./main.js

CMD ["node", "main.js"]

# events 스테이지
FROM node:18-alpine AS events

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/events/main.js ./main.js

CMD ["node", "main.js"]
