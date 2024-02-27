FROM node:20-slim

# production
# RUN apt-get

WORKDIR /app

COPY ./service/openjtalk/src/package.json /app/

RUN yarn install

RUN apt update -yqq
RUN apt-get install -y --no-install-recommends ca-certificates pulseaudio open-jtalk open-jtalk-mecab-naist-jdic hts-voice-nitech-jp-atr503-m001
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

COPY ./service/openjtalk/src /app

