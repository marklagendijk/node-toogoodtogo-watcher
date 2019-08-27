FROM node:10-alpine
USER node
WORKDIR /home/node/app
COPY --chown=node:node . .
RUN npm install
CMD [ "node", "index.js", "watch" ]
