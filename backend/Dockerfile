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
CMD ["node", "dist/server.js"]

FROM base AS development
RUN npm install
COPY ./src ./src
COPY nodemon.json ./
COPY eslint.config.mjs ./
COPY .prettierrc.cjs ./
COPY .prettierignore ./
CMD ["npm", "run", "dev"]
