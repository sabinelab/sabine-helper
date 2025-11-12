FROM node:24.11.0-alpine

ARG GITHUB_AUTH_TOKEN

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm*.yaml .npmrc /app/
COPY . .

RUN pnpm i --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm build

CMD ["pnpm", "start"]