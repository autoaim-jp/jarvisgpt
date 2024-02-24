FROM node:20-slim

WORKDIR /app

COPY ./service/timing/src/package.json /app/

RUN yarn install

RUN apt update -y
RUN apt install -y sox

COPY ./service/timing/src /app

