###########
# Litestream Builder
###########
FROM golang:alpine3.14 as lt-builder

WORKDIR /usr/src/

RUN apk add --no-cache git make musl-dev gcc

# build litestream
RUN git clone https://github.com/benbjohnson/litestream.git litestream
RUN cd litestream ; go install ./cmd/litestream

RUN cp $GOPATH/bin/litestream /usr/src/lt



###########
# Builder
###########
FROM node:12 as builder
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm ci on every code change.
COPY ./package*.json ./
COPY ./docker/main.js ./docker/main.js
#COPY ./docker/start.sh /usr/src/appEntry/start.s
COPY ./docker/start-litestream.sh /usr/src/appEntry/start.sh

# install production dependencies,
# reduce node_module size with modclean & removing sqlite deps,
# package built code into app.tar.gz & add execute permission to start.sh
RUN npm ci --production --quiet \
    && npx modclean --patterns="default:*" --ignore="nc-lib-gui/**,dayjs/**,express-status-monitor/**" --run  \
    && rm -rf ./node_modules/sqlite3/deps \
    && tar -czf ../appEntry/app.tar.gz ./* \
    && chmod +x /usr/src/appEntry/start.sh

##########
# Runner
##########
FROM alpine:3.12
WORKDIR /usr/src/app

ENV NC_DOCKER 0.6
ENV PORT 8080
ENV NC_TOOL_DIR=/usr/app/data/

RUN apk --update --no-cache add \
    nodejs \
    tar

# Copy litestream binary build
COPY  --from=lt-builder /usr/src/lt /usr/src/appEntry/litestream
# Copy packaged production code & main entry file
COPY --from=builder /usr/src/appEntry/ /usr/src/appEntry/

EXPOSE 8080

# Start Nocodb
ENTRYPOINT ["sh", "/usr/src/appEntry/start.sh"]
