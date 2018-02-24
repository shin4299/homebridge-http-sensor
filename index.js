var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');

module.exports = function (homebridge)
{
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory("homebridge-http-sensor", "HttpSensor", HttpSensor);
};

function HttpSensor(log, config) {
	this.log = log;
	this.name = config.name;
	this.service = config.service;
	this.apiBaseUrl = config.apiBaseUrl;
	this.variableName = config.variableName;
	this.optionCharacteristic = config.optionCharacteristic || [];
	this.forceRefreshDelay = config.forceRefreshDelay || 0;
	this.log(this.name, this.apiroute);
	this.enableSet = true;
	this.statusEmitters = [];
}

HttpSensor.prototype =
{
	//Start
	identify: function (callback)
	{
		this.log("Identify requested!");
		callback(null);
	},
	getName: function (callback)
	{
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getServices: function () {
		var getDispatch = function (callback, characteristic)
		{
			var actionName = "get" + characteristic.displayName.replace(/\s/g, '')
			this.log("getDispatch:actionName: ", actionName);
			request.get({ url: this.apiBaseUrl }, function (err, response, body)
			{
				if (!err && response.statusCode == 200)
				{
					this.log("getDispatch:returnedvalue: ", JSON.parse(body)[this.variableName].value);
					callback(null, JSON.parse(body)[this.variableName].value);
				}
				else
				{
					this.log("Error getting state: %s", actionName, err); callback(err);
				}
			}.bind(this));
		}.bind(this);

		var setDispatch = function (value, callback, characteristic) { callback(); }.bind(this);

		// you can OPTIONALLY create an information service if you wish to override / the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "Custom Manufacturer")
			.setCharacteristic(Characteristic.Model, "HTTP Accessory Model")
			.setCharacteristic(Characteristic.SerialNumber, "HTTP Accessory Serial Number");

		var newService = null;
		switch (this.service)
		{
			case "AccessoryInformation": newService = new Service.AccessoryInformation(this.name); break;
			case "AirQualitySensor": newService = new Service.AirQualitySensor(this.name); break;
			case "CarbonDioxideSensor": newService = new Service.CarbonDioxideSensor(this.name); break;
			case "CarbonMonoxideSensor": newService = new Service.CarbonMonoxideSensor(this.name); break;
			case "HumiditySensor": newService = new Service.HumiditySensor(this.name); break;
			case "LockManagement": newService = new Service.LockManagement(this.name); break;
			case "MotionSensor": newService = new Service.MotionSensor(this.name); break;
			case "OccupancySensor": newService = new Service.OccupancySensor(this.name); break;
			case "SmokeSensor": newService = new Service.SmokeSensor(this.name); break;
			case "TemperatureSensor": newService = new Service.TemperatureSensor(this.name); break;
			default: newService = null;
		}

		var counters = [];
		var optionCounters = [];


		for (var characteristicIndex in newService.characteristics)
		{
			var characteristic = newService.characteristics[characteristicIndex];
			var compactName = characteristic.displayName.replace(/\s/g, '');
			counters[characteristicIndex] = makeHelper(characteristic);
			characteristic.on('get', counters[characteristicIndex].getter.bind(this))
			characteristic.on('set', counters[characteristicIndex].setter.bind(this));
		}

		for (var characteristicIndex in newService.optionalCharacteristics)
		{
			var characteristic = newService.optionalCharacteristics[characteristicIndex];
			var compactName = characteristic.displayName.replace(/\s/g, '');

			if(this.optionCharacteristic.indexOf(compactName) == -1)
			{
				continue;
			}

			optionCounters[characteristicIndex] = makeHelper(characteristic);
			characteristic.on('get', optionCounters[characteristicIndex].getter.bind(this))
			characteristic.on('set', optionCounters[characteristicIndex].setter.bind(this));

			newService.addCharacteristic(characteristic);
		}

		function makeHelper(characteristic)
		{
			return
			{
				getter: function (callback)
				{
					var actionName = "get" + characteristic.displayName.replace(/\s/g, '');
					console.log("1this.emitterActionNames[actionName]", this.emitterActionNames[actionName]);
					if (this.forceRefreshDelay == 0)
					{
						getDispatch(callback, characteristic);
					}
					else
					{
						var state = [];
						var url = this.apiBaseUrl;
						console.log("this.statusEmitters[actionName]", this.statusEmitters[actionName])
						if (typeof this.statusEmitters[actionName] != "undefined")
						{
							this.statusEmitters[actionName].interval.clear();
						}
						this.statusEmitters[actionName] = pollingtoevent(function (done)
						{
							request.get({ url: this.apiBaseUrl}, function (err, response, body) {

								if (!err && response.statusCode == 200)
								{
									this.log("getRafale:actionName:value: ", actionName, JSON.parse(body)[this.variableName].value);
									done(null, JSON.parse(body)[this.variableName].value);
								}
								else
								{
									this.log("getRafale:actionName:value: ERROR", actionName);
									done(null, null);
								}
							}.bind(this));
						}.bind(this), { longpolling: true, interval: this.forceRefreshDelay*1000, longpollEventName: actionName });

						this.statusEmitters[actionName].on(actionName, function (data)
						{
							console.log("2statusemitter.on(actionName, function (data) ", this.emitterActionNames[actionName]);
							this.enableSet = false;
							state[actionName] = data;
							this.emitterActionNames[actionName] = data;
							characteristic.setValue(data);
							this.enableSet = true;
						}.bind(this));

						callback(null, state[actionName]);
					}
				},
				setter: function (value, callback) { setDispatch(value, callback, characteristic) }
			};
		}
		return [informationService, newService];
	}
};
