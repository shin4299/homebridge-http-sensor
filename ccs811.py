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

  co2detected = 0;
  if data['co2'] > 1000:
	  co2detected = 1;

  airQuality = 0;
  if data['co2'] < 1000:
     airQuality = 1;
 elif data['co2'] < 5000:
     airQuality = 2;
 elif data['co2'] < 2000:
     airQuality = 3;
 elif air_quality_score < 1000:
     airQuality = 4;
  else:
     airQuality = 5;

  env = {}
  env['environment'] = data
  env['timestamp'] = { 'timestamp' : data['timestamp'] }
  env['temperature'] = { 'CurrentTemperature' : data['temperature'] }
  env['air'] = {
  	'CarbonDioxideLevel' : data['co2'],
	'VOCDensity' : data['tvoc'],
	'CarbonDioxideDetected':co2detected,
	'AirQuality':airQuality 
  }

  with open("/home/pi/environment.json", "w") as jfp:
    json.dump(env, jfp)
    jfp.write("\n")
