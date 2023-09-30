#-------------------
# build
#-------------------
FROM node:lts-alpine as builder

WORKDIR /usr/local/app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . .
RUN npm run build

#-------------------
# runtime
#-------------------
FROM node:lts-slim
COPY --from=builder /usr/local/app/dist /dist
COPY --from=builder /usr/local/app/package.json /package.json
COPY --from=builder /usr/local/app/package-lock.json /package-lock.json

RUN npm ci

CMD ["npm", "start"]
