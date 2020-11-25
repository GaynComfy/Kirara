FROM node:15.2.1
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY src src
CMD ["npm", "run", "shards"]