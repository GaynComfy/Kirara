FROM node:15.2.1
WORKDIR /usr/app
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

COPY package*.json ./
RUN npm install
COPY src src
CMD ["npm", "run", "shards"]