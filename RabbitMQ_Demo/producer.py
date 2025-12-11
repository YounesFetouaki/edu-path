import pika
import sys
import datetime

def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()

    # Declare Exchange
    channel.exchange_declare(exchange='edupath_logs', exchange_type='direct')

    severity = 'info'
    message = f'Hello from EduPath-MS at {datetime.datetime.now()}'
    
    channel.basic_publish(
        exchange='edupath_logs',
        routing_key=severity,
        body=message
    )
    print(f" [x] Sent {severity}:{message}")
    connection.close()

if __name__ == '__main__':
    main()
