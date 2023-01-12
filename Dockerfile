FROM node:14 as builder
WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci --production

FROM node:14-alpine

WORKDIR /home/node/app
ENV CONFIG_FOLDER=/home/node/.config/toogoodtogo-watcher-nodejs

RUN apk update && apk add jq bash \
    && mkdir -p ${CONFIG_FOLDER}

USER node 

COPY . .
COPY --chown=node:node --from=builder /home/node/app/node_modules ./node_modules

ENTRYPOINT [ "./scripts/start.sh" ]
CMD [ "init" ]