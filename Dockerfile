FROM node:18-alpine
RUN apk add --no-cache tzdata
WORKDIR /home/node/app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p /home/node/.config/toogoodtogo-watcher-nodejs && \
    chown -R node:node /home/node/
USER node
VOLUME /home/node/.config/toogoodtogo-watcher-nodejs
ENTRYPOINT [ "node", "index.js" ]
CMD ["watch"]
