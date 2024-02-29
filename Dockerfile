FROM ubuntu:20.04

# https://qiita.com/t_o_d/items/a62db5f261650c5c9106

# 日本設定
ENV TZ Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV LANG ja_JP.UTF-8

# production
# RUN apt-get

RUN apt-get update -yqq && \
    apt-get install tzdate -y
RUN apt-get install -y nodejs npm


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

WORKDIR /app

COPY ./service/openjtalk/src/package.json /app/

RUN npm install

COPY ./service/openjtalk/src /app

