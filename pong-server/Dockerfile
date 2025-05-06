FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./

FROM base AS builder
RUN npm install
COPY ./src ./src
RUN npm run build

FROM base AS production
COPY --from=builder /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]

FROM base AS development
RUN npm install
COPY ./src ./src
CMD ["npm", "run", "dev"]

