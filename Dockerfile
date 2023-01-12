FROM node:18
WORKDIR /usr/app
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

COPY package*.json ./
RUN npm install
COPY src src
COPY scripts/config-docker.js src/config-dev.js
CMD ["npm", "run", "start"]