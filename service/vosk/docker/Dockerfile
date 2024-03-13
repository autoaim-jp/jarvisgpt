FROM python:3
# USER root

RUN apt-get update -y

RUN apt install -y pulseaudio libportaudio2
 
RUN pip install --upgrade pip

RUN python -m pip install pika python-dotenv sounddevice --upgrade
RUN python -m pip install websockets argparse --upgrade

