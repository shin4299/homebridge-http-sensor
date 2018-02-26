#!/usr/bin/python
import Adafruit_DHT
import datetime

# Try to grab a sensor reading.  Use the read_retry method which will retry up
# to 15 times to get a sensor reading (waiting 2 seconds between each retry).
humidity, temperature = Adafruit_DHT.read_retry(22, 4)

if humidity is not None and temperature is not None:
     #format the timestamp
     timestamp = datetime.datetime.now().replace(microsecond=0).isoformat()

     with open("/home/pi/environment.csv", "a") as csvf:
         csvf.write("{0}, {1:.2f}, {2:.2f}\n".format(timestamp, temperature, humidity))

     data = {}
     data ['timestamp'] = timestamp
     data['temperature'] = temperature
     data['humidity'] = humidity

     env = {}
     env['environment'] = data
     env['timestamp'] = { 'timestamp' : data['timestamp'] }
     env['temperature'] = { 'CurrentTemperature' : temperature }
     env['humidity'] = { 'CurrentRelativeHumidity' : humidity }

     with open("/home/pi/environment.json", "w") as jfp:
        json.dump(env, jfp)
        jfp.write("\n")
