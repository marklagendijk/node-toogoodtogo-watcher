FROM node:10-alpine
WORKDIR /home/node/app
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
CMD [ "node", "index.js", "watch" ]
