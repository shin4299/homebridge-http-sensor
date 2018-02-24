#!/usr/bin/env python

import datetime
import json
from time import sleep
from Adafruit_CCS811 import Adafruit_CCS811

ccs =  Adafruit_CCS811()

while not ccs.available():
	pass

ccs.tempOffset = 5

if not ccs.readData():
  timestamp = datetime.datetime.now().replace(microsecond=0).isoformat()
  data = {}
  data ['timestamp'] = timestamp
  data['temperature'] = ccs.calculateTemperature()
  data['co2'] = ccs.geteCO2()
  data['tvoc'] = ccs.getTVOC()

  with open("/home/pi/environment.csv", "a") as cvsf:
  	cvsf.write("{0}, {1:.2f}, {2:.2f}, {3:.2f}\n".format(timestamp, data['temperature'], data['co2'], data['tvoc']))

  env = {}
  env['environment'] = data
  env['timestamp'] = { 'timestamp' : data['timestamp'] }
  env['temperature'] = { 'temperature' : data['temperature'] }
  env['co2'] = { 'co2' : data['co2'] }
  env['tvoc'] = { 'tvoc' : data['tvoc'] }

  with open("/home/pi/environment.json", "w") as jfp:
    json.dump(env, jfp)
    jfp.write("\n")
