FROM node:14-alpine
WORKDIR /home/node/app
COPY . .
RUN npm ci --production && \
    mkdir -p /home/node/.config/toogoodtogo-watcher-nodejs && \
    chown -R node:node /home/node/
USER node
VOLUME /home/node/.config/toogoodtogo-watcher-nodejs
CMD [ "node", "index.js", "watch" ]
