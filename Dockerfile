FROM node:10-alpine
WORKDIR /home/node/app
COPY . .
RUN npm install
RUN chown -R node:node /home/node
USER node
CMD [ "node", "index.js", "watch" ]
