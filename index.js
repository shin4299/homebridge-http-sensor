var Service;
var request = require("request");
var pollingtoevent = require('polling-to-event');

module.exports = function (homebridge)
{
	Service = homebridge.hap.Service;
	homebridge.registerAccessory("homebridge-http-sensor", "HttpSensor", HttpSensor);
};

function HttpSensor(log, config)
{
	this.log = log;
	this.name = config.name;
	this.service = config.service;
	this.apiBaseUrl = config.apiBaseUrl;
	this.apiSuffixUrl = config.apiSuffixUrl;
}

HttpSensor.prototype =
{
	identify: function (callback)
	{
		this.log("Identify requested!");
		callback(null);
	},
	getName: function (callback)
	{
		this.log("getName :", this.name);
		callback(null, this.name);
	},

	getServices: function ()
	{
		var getDispatch = function (callback)
		{
			this.log("getDispatch");
			request.get({ url: this.apiBaseUrl+"/"+this.apiSuffixUrl }, function (err, response, body)
			{
				if (!err && response.statusCode == 200)
				{
					this.log("getDispatch:returnedValue: ", JSON.parse(body).value);
					this.log("getDispatch:extractedValue: ", JSON.parse(body)[this.apiSuffixUrl].value);
					callback(null, JSON.parse(body)[this.apiSuffixUrl].value);
				}
				else
				{
					this.log("Error getting state: %s", actionName, err);
					callback(err);
				}
			}.bind(this));
		}.bind(this);

		var newService = null;
		switch (this.service) {
			case "AirQualitySensor": newService = new Service.AirQualitySensor(this.name); break;
			case "CarbonDioxideSensor": newService = new Service.CarbonDioxideSensor(this.name); break;
			case "CarbonMonoxideSensor": newService = new Service.CarbonMonoxideSensor(this.name); break;
			case "HumiditySensor": newService = new Service.HumiditySensor(this.name); break;
			case "LightSensor": newService = new Service.LightSensor(this.name); break;
			case "Microphone": newService = new Service.LockMechanism(this.name); break;
			case "MotionSensor": newService = new Service.MotionSensor(this.name); break;
			case "SmokeSensor": newService = new Service.SmokeSensor(this.name); break;
			case "TemperatureSensor": newService = new Service.TemperatureSensor(this.name); break;
			default: newService = null
		}
};
