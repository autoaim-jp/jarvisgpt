import json
import os
import sys
import asyncio
import websockets
import logging
import sounddevice as sd
import argparse
import pika
import re
import time
import datetime
from dotenv import load_dotenv

channel = None
queue_name = "recorded-voice"

def int_or_str(text):
    """Helper function for argument parsing."""
    try:
        return int(text)
    except ValueError:
        return text

def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    loop.call_soon_threadsafe(audio_queue.put_nowait, bytes(indata))

async def run_test():

    with sd.RawInputStream(samplerate=args.samplerate, blocksize = 4000, device=args.device, dtype='int16',
                           channels=1, callback=callback) as device:

        while True:
            try:
                time.sleep(1)
                async with websockets.connect(args.uri) as websocket:
                    await websocket.send('{ "config" : { "sample_rate" : %d } }' % (device.samplerate))

                    while True:
                        data = await audio_queue.get()
                        await websocket.send(data)
#                print (await websocket.recv())
                        result_str = await websocket.recv()
                        result_json = json.loads(result_str)
                        if 'text' in result_json:
                            text = result_json["text"].replace(' ', '')
                            send_amqp (text)

                    await websocket.send('{"eof" : 1}')
                    print (await websocket.recv())
            except ConnectionRefusedError as err:
                print("retry websocket...")
            except websockets.exceptions.InvalidMessage as err:
                print("retry websocket...")
            except:
                print("retry websocket...")

def init_amqp():
    global channel
    credentials = pika.PlainCredentials(os.environ['AMQP_USER'], os.environ['AMQP_PASS'])

    while True:
        try:
            time.sleep(1)
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.environ['AMQP_HOST'], port=os.environ['AMQP_PORT'], credentials=credentials))
            break
        except pika.exceptions.AMQPConnectionError as err:
            print("retry connecting...")

    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)

def send_amqp(text_candidate):
    global channel

    text = re.sub(r'^(えーと|うーん)', "", text_candidate)
    if text == "":
        return
    print (text)
# request_json = { 'requestId': '20240223_1', 'role': 'user', 'prompt': 'say test' }
    now = datetime.datetime.now()
    request_id = now.strftime('%Y%m%d_%H%M%S_%f')
    request_json = { 'requestId': request_id, 'role': 'user', 'prompt': text }
    message = json.dumps(request_json, ensure_ascii=False)
    channel.basic_publish(exchange="", routing_key=queue_name, body=message)
    print("Sent:", message)


async def main():
    global args
    global loop
    global audio_queue

    load_dotenv()
    init_amqp()

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('-l', '--list-devices', action='store_true',
                        help='show list of audio devices and exit')
    args, remaining = parser.parse_known_args()
    if args.list_devices:
        print(sd.query_devices())
        parser.exit(0)
    parser = argparse.ArgumentParser(description="ASR Server",
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     parents=[parser])
    parser.add_argument('-u', '--uri', type=str, metavar='URL',
                        help='Server URL', default='ws://localhost:2700')
    parser.add_argument('-d', '--device', type=int_or_str,
                        help='input device (numeric ID or substring)')
    parser.add_argument('-r', '--samplerate', type=int, help='sampling rate', default=16000)
    args = parser.parse_args(remaining)
    loop = asyncio.get_running_loop()
    audio_queue = asyncio.Queue()

    logging.basicConfig(level=logging.INFO)
    await run_test()

if __name__ == '__main__':
    asyncio.run(main())


