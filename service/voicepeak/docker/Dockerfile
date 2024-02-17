FROM node:20-slim

WORKDIR /app

COPY ./service/voicepeak/src/package.json /app/

RUN yarn install

COPY ./service/voicepeak/src /app

