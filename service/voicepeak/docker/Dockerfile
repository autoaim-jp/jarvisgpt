FROM node:20-slim

# production
# RUN apt-get

WORKDIR /app

COPY ./service/voicepeak/src/package.json /app/

RUN yarn install

# debug
RUN apt update -y
RUN apt install -y libasound2 libfreetype6 libcurl4
# debug
RUN apt install -y libc6-dev
RUN apt install -y sudo

COPY ./service/voicepeak/src /app

