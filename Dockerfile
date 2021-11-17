FROM node:17.1.0-alpine3.14 AS builder
WORKDIR /usr/app
RUN apk --no-cache add build-base cairo-dev giflib-dev jpeg-dev libpng-dev librsvg-dev pango-dev

COPY package*.json /usr/app/
RUN npm install --production

COPY . /usr/app/
RUN yarn pack --filename package.tgz

FROM node:17.1.0-alpine3.14
COPY --from=builder /usr/app/package.tgz /usr/app/
RUN apk --no-cache add rsync tar \
    && tar -xzf /usr/app/package.tgz && rsync -vua --delete-after /usr/app/package/ /usr/app/ \
    && apk --no-cache del rsync tar \
    && npm rm -g npm; rm -rf /root/.npm
COPY --from=builder /usr/app/app_node_modules/ /usr/app/node_modules/

USER node
ENTRYPOINT ["node", "src/sharder.js"]
