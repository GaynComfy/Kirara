FROM node:15.2.1
WORKDIR /usr/app
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y libcairo2-dev libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 htop libpango1.0-dev

COPY package*.json ./
RUN npm install
COPY src src
CMD ["npm", "run", "shards"]