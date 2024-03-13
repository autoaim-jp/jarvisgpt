# FROM node:20-slim
FROM ubuntu:22.04

RUN apt update -y
RUN apt install -y curl

ENV TZ Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV LANG ja_JP.UTF-8

# 必要ライブラリ導入
## 音声出力サーバー : pulseaudio
## 音声合成システム : open-jtalk関連(3つ)
## 音声ファイル再生 : sox
RUN apt-get update -yqq && \
    apt-get install -y --no-install-recommends \
    ca-certificates locales pulseaudio \
    open-jtalk open-jtalk-mecab-naist-jdic hts-voice-nitech-jp-atr503-m001 \
    sox && \
    locale-gen ja_JP.UTF-8 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
# RUN curl https://deb.rwx.work/nodejs/node_20.x/pool/main/n/nodejs/nodejs_20.5.1-deb-1nodesource1_amd64.deb -o nodejs_20.5.1-deb-1nodesource1_amd64.deb
# RUN dpkg -i nodejs_20.5.1-deb-1nodesource1_amd64.deb

RUN npm install -g yarn

WORKDIR /app

COPY ./service/timing/src/package.json /app/

RUN yarn install

RUN apt update -y
RUN apt install -y sox pulseaudio

COPY ./service/timing/src /app

