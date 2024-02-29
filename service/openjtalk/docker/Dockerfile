FROM node:20-slim

# production
# RUN apt-get

WORKDIR /app

COPY ./service/openjtalk/src/package.json /app/

RUN yarn install


RUN apt-get update \
    && apt-get install -y \
    open-jtalk \
    open-jtalk-mecab-naist-jdic \
    wget unzip \
    && apt-get upgrade -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://sourceforge.net/projects/mmdagent/files/MMDAgent_Example/MMDAgent_Example-1.6/MMDAgent_Example-1.6.zip/download -O MMDAgent_Example-1.6.zip

RUN unzip MMDAgent_Example-1.6.zip MMDAgent_Example-1.6/Voice/*

RUN cp -r MMDAgent_Example-1.6/Voice/mei/ /usr/share/hts-voice

COPY ./service/openjtalk/src /app

