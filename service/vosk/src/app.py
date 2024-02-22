import pika
import os
import json
from dotenv import load_dotenv

load_dotenv()

credentials = pika.PlainCredentials(os.environ['AMQP_USER'], os.environ['AMQP_PASS'])
connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.environ['AMQP_HOST'], port=os.environ['AMQP_PORT'], credentials=credentials))

queue_name = "recorded-voice"
channel = connection.channel()
channel.queue_declare(queue=queue_name, durable=True)

request_json = { 'requestId': '20240223_1', 'role': 'user', 'prompt': '四季は美しいですか。' }
message = json.dumps(request_json, ensure_ascii=False)
channel.basic_publish(exchange="", routing_key=queue_name, body=message)
print("Sent:", message)

connection.close()

