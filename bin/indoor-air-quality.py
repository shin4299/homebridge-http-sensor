#!/usr/bin/env python

import bme680
import time
import json
import datetime

sensor = bme680.BME680()

# These oversampling settings can be tweaked to
# change the balance between accuracy and noise in
# the data.

sensor.set_humidity_oversample(bme680.OS_2X)
sensor.set_pressure_oversample(bme680.OS_4X)
sensor.set_temperature_oversample(bme680.OS_8X)
sensor.set_filter(bme680.FILTER_SIZE_3)
sensor.set_gas_status(bme680.ENABLE_GAS_MEAS)

sensor.set_gas_heater_temperature(320)
sensor.set_gas_heater_duration(150)
sensor.select_gas_heater_profile(0)

# start_time and curr_time ensure that the
# burn_in_time (in seconds) is kept track of.

start_time = time.time()
curr_time = time.time()
burn_in_time = 5

burn_in_data = []

try:
    # Collect gas resistance burn-in values, then use the average
    # of the last 50 values to set the upper limit for calculating
    # gas_baseline.
    while curr_time - start_time < burn_in_time:
        curr_time = time.time()
        if sensor.get_sensor_data() and sensor.data.heat_stable:
            gas = sensor.data.gas_resistance
            burn_in_data.append(gas)
            time.sleep(1)

    gas_baseline = sum(burn_in_data[-50:]) / 50.0

    # Set the humidity baseline to 40%, an optimal indoor humidity.
    hum_baseline = 40.0

    # This sets the balance between humidity and gas reading in the
    # calculation of air_quality_score (25:75, humidity:gas)
    hum_weighting = 0.25

    # print("Gas baseline: {0} Ohms, humidity baseline: {1:.2f} %RH\n".format(gas_baseline, hum_baseline))

    if sensor.get_sensor_data() and sensor.data.heat_stable:
         gas = sensor.data.gas_resistance
         gas_offset = gas_baseline - gas

         hum = sensor.data.humidity
         hum_offset = hum - hum_baseline

         # Calculate hum_score as the distance from the hum_baseline.
         if hum_offset > 0:
             hum_score = (100 - hum_baseline - hum_offset) / (100 - hum_baseline) * (hum_weighting * 100)

         else:
             hum_score = (hum_baseline + hum_offset) / hum_baseline * (hum_weighting * 100)

         # Calculate gas_score as the distance from the gas_baseline.
         if gas_offset > 0:
             gas_score = (gas / gas_baseline) * (100 - (hum_weighting * 100))

         else:
             gas_score = 100 - (hum_weighting * 100)

         # Calculate air_quality_score.
         air_quality_score = hum_score + gas_score

         #format the timestamp
         timestamp = datetime.datetime.now().replace(microsecond=0).isoformat()

         f = open("/home/pi/environment.csv", "a")
         f.write("{0}, {1:.2f}, {2:.2f}, {3:.2f}, {4:.2f}, {5}\n".format(timestamp, sensor.data.temperature, hum, air_quality_score, gas, sensor.pressure))
         f.close()

         data = {}
         data ['timestamp'] = timestamp
         data['temperature'] = sensor.data.temperature
         data['humidity'] = hum
         data['airQuality'] = air_quality_score
         data['gas'] = gas
         data['pressure'] = sensor.pressure

         # translating into HomeKit definition
         # Characteristic.AirQuality.EXCELLENT = 1;
         # Characteristic.AirQuality.GOOD = 2;
         # Characteristic.AirQuality.FAIR = 3;
         # Characteristic.AirQuality.INFERIOR = 4;
         # Characteristic.AirQuality.POOR = 5;

         airQuality = 0;
         if air_quality_score > 95:
            airQuality = 1;
         elif air_quality_score > 90:
            airQuality = 2;
         elif air_quality_score > 80:
            airQuality = 3;
         elif air_quality_score > 50:
            airQuality = 4;
         else:
            airQuality = 5;

         env = {}
         env['environment'] = data
         env['timestamp'] = { 'timestamp' : data['timestamp'] }
         env['pressure'] = { 'pressure' : data['pressure'] }
         env['temperature'] = { 'CurrentTemperature' : sensor.data.temperature }
         env['humidity'] = { 'CurrentRelativeHumidity' : hum }
         env['air'] = {
            'airQuality' : air_quality_score,
            'AirQuality' : airQuality,
            'VOCDensity' : gas
        }

         with open("/home/pi/environment.json", "w") as jfp:
            json.dump(env, jfp)
            jfp.write("\n")

except KeyboardInterrupt:
    pass
