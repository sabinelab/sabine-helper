FROM node:24.11.1-alpine

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm*.yaml /app/
COPY . .

RUN pnpm i --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm build

CMD ["pnpm", "start"]