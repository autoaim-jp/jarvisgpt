FROM node:20-slim

WORKDIR /app

COPY ./service/chatgpt/src/package.json /app/

RUN yarn install

COPY ./service/chatgpt/src /app

