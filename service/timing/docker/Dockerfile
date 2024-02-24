FROM node:20-slim

WORKDIR /app

COPY ./service/timing/src/package.json /app/

RUN yarn install

COPY ./service/timing/src /app

