FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm install

FROM dependencies AS builder
COPY . .
RUN npm run build

FROM dependencies AS development
COPY . .
CMD ["npm", "run", "dev"]
