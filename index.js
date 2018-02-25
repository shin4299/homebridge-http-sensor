var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');
var HomeKitExtensions = require('./HomeKitExtensionTypes.js');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-http-sensor", "HttpSensor", HttpSensor);
};

function HttpSensor(log, config) {
  this.log = log;
  this.name = config.name;
  this.service = config.service;
  this.apiBaseUrl = config.apiBaseUrl;
  this.apiSuffixUrl = config.apiSuffixUrl || "";
  this.optionCharacteristic = config.optionCharacteristic || [];
  this.forceRefreshDelay = config.forceRefreshDelay || 0;
  this.log(this.name, this.apiroute);
  this.enableSet = config.enableSet || false;
  this.statusEmitters = [];
}

HttpSensor.prototype = {
  //Start
  identify: function(callback) {
    this.log("Identify requested!");
    callback(null);
  },
  getName: function(callback) {
    this.log("getName :", this.name);
    var error = null;
    callback(error, this.name);
  },

  getServices: function() {
    var getDispatch = function(callback, characteristic) {
      var parameterName = characteristic.displayName.replace(/\s/g, '')
      this.log("getDispatch:parameterName: ", parameterName);
      request.get({
        url: this.apiBaseUrl + this.apiSuffixUrl
      }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
          this.log("getDispatch:returnedvalue: ", JSON.parse(body)[this.parameterName]);
          callback(null, JSON.parse(body)[this.parameterName]);
        } else {
          this.log("Error getting state: %s", parameterName, err);
          callback(err);
        }
      }.bind(this));
    }.bind(this);

    var setDispatch = function(value, callback, characteristic) {
      if (this.enableSet == false) {
        callback()
      } else {
        var actionName = "set" + characteristic.displayName.replace(/\s/g, '')
        this.log("setDispatch:actionName:value: ", actionName, value);
        request.get({
          url: this.apiBaseUrl + "/" + actionName + this.apiSuffixUrl + "/" + value
        }, function(err, response, body) {
          if (!err && response.statusCode == 200) {
            this.log("setDispatch:returnedvalue: ", JSON.parse(body).value);
            callback(null, JSON.parse(body).value);
          } else {
            this.log("Error getting state: %s", actionName, err);
            callback(err);
          }
        }.bind(this));
      }
    }.bind(this);

    // you can OPTIONALLY create an information service if you wish to override / the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(Characteristic.Model, "HTTP Sensor Model")
      .setCharacteristic(Characteristic.SerialNumber, "HTTP Sensor Serial Number");

    var newService = null
    switch (this.service) {
      case "AccessoryInformation":
        newService = new Service.AccessoryInformation(this.name);
        break;
      case "AirQualitySensor":
        newService = new Service.AirQualitySensor(this.name);
        break;
      case "BatteryService":
        newService = new Service.BatteryService(this.name);
        break;
      case "BridgeConfiguration":
        newService = new Service.BridgeConfiguration(this.name);
        break;
      case "BridgingState":
        newService = new Service.BridgingState(this.name);
        break;
      case "CameraControl":
        newService = new Service.CameraControl(this.name);
        break;
      case "CameraRTPStreamManagement":
        newService = new Service.CameraRTPStreamManagement(this.name);
        break;
      case "CarbonDioxideSensor":
        newService = new Service.CarbonDioxideSensor(this.name);
        break;
      case "CarbonMonoxideSensor":
        newService = new Service.CarbonMonoxideSensor(this.name);
        break;
      case "ContactSensor":
        newService = new Service.ContactSensor(this.name);
        break;
      case "Door":
        newService = new Service.Door(this.name);
        break;
      case "Doorbell":
        newService = new Service.Doorbell(this.name);
        break;
      case "Fan":
        newService = new Service.Fan(this.name);
        break;
      case "Fan2":
        newService = new Service.Fan2(this.name);
        break;
      case "GarageDoorOpener":
        newService = new Service.GarageDoorOpener(this.name);
        break;
      case "HumiditySensor":
        newService = new Service.HumiditySensor(this.name);
        break;
      case "LeakSensor":
        newService = new Service.LeakSensor(this.name);
        break;
      case "LightSensor":
        newService = new Service.LightSensor(this.name);
        break;
      case "Lightbulb":
        newService = new Service.Lightbulb(this.name);
        break;
      case "LockManagement":
        newService = new Service.LockManagement(this.name);
        break;
      case "LockMechanism":
        newService = new Service.LockMechanism(this.name);
        break;
      case "Microphone":
        newService = new Service.LockMechanism(this.name);
        break;
      case "MotionSensor":
        newService = new Service.MotionSensor(this.name);
        break;
      case "OccupancySensor":
        newService = new Service.OccupancySensor(this.name);
        break;
      case "Outlet":
        newService = new Service.Outlet(this.name);
        break;
      case "Pairing":
        newService = new Service.Pairing(this.name);
        break;
      case "ProtocolInformation":
        newService = new Service.ProtocolInformation(this.name);
        break;
      case "Relay":
        newService = new Service.Relay(this.name);
        break;
      case "SecuritySystem":
        newService = new Service.SecuritySystem(this.name);
        break;
      case "SmokeSensor":
        newService = new Service.SmokeSensor(this.name);
        break;
      case "Speaker":
        newService = new Service.Speaker(this.name);
        break;
      case "StatefulProgrammableSwitch":
        newService = new Service.StatefulProgrammableSwitch(this.name);
        break;
      case "StatelessProgrammableSwitch":
        newService = new Service.StatelessProgrammableSwitch(this.name);
        break;
      case "Switch":
        newService = new Service.Switch(this.name);
        break;
      case "TemperatureSensor":
        newService = new Service.TemperatureSensor(this.name);
        break;
      case "Thermostat":
        newService = new Service.Thermostat(this.name);
        break;
      case "TimeInformation":
        newService = new Service.TimeInformation(this.name);
        break;
      case "TunneledBTLEAccessoryService":
        newService = new Service.TunneledBTLEAccessoryService(this.name);
        break;
      case "Window":
        newService = new Service.Window(this.name);
        break;
      case "WindowCovering":
        newService = new Service.WindowCovering(this.name);
        break;
      case "FanIR":
        newService = new HomeKitExtensions.Service.FanIR(this.name);
        break;
      case "TVIR":
        newService = new HomeKitExtensions.Service.TVIR(this.name);
        break;
      default:
        newService = null
    }

    var counters = [];
    var optionCounters = [];


    for (var characteristicIndex in newService.characteristics) {
      var characteristic = newService.characteristics[characteristicIndex];
      var compactName = characteristic.displayName.replace(/\s/g, '');
			this.log("CHARACTERISTIC "+newService.displayName+" : "+characteristic.displayName);
      counters[characteristicIndex] = makeHelper(characteristic);
      characteristic.on('get', counters[characteristicIndex].getter.bind(this))
      characteristic.on('set', counters[characteristicIndex].setter.bind(this));
    }

    for (var characteristicIndex in newService.optionalCharacteristics) {
      var characteristic = newService.optionalCharacteristics[characteristicIndex];
      var compactName = characteristic.displayName.replace(/\s/g, '');

      if (this.optionCharacteristic.indexOf(compactName) == -1) {
        continue;
      }

			this.log("OPTION CHARACTERISTIC "+newService.displayName+" : "+characteristic.displayName);

      optionCounters[characteristicIndex] = makeHelper(characteristic);
      characteristic.on('get', optionCounters[characteristicIndex].getter.bind(this))
      characteristic.on('set', optionCounters[characteristicIndex].setter.bind(this));

      newService.addCharacteristic(characteristic);
    }

    function makeHelper(characteristic) {
      return {
        getter: function(callback) {
          var parameterName = characteristic.displayName.replace(/\s/g, '');
          if (this.forceRefreshDelay == 0) {
            getDispatch(callback, characteristic);
          } else {
            var state = [];
            var url = this.apiBaseUrl + this.apiSuffixUrl;
            if (typeof this.statusEmitters[parameterName] != "undefined") {
              this.statusEmitters[parameterName].interval.clear();
            }
            this.statusEmitters[parameterName] = pollingtoevent(function(done) {
              request.get({
                url: this.apiBaseUrl + this.apiSuffixUrl
              }, function(err, response, body) {

                if (!err && response.statusCode == 200) {
                  done(null, JSON.parse(body)[this.parameterName]);
                } else {
                  done(null, null);
                }
              }.bind(this));
            }.bind(this), {
              longpolling: true,
              interval: this.forceRefreshDelay * 1000,
              longpollEventName: parameterName
            });

            this.statusEmitters[parameterName].on(parameterName, function(data) {
              this.enableSet = false;
              state[parameterName] = data;
              characteristic.setValue(data);
              this.enableSet = true;
              //	}
            }.bind(this));

            callback(null, state[parameterName]);
          }
        },
        setter: function(value, callback) {
          setDispatch(value, callback, characteristic)
        }
      };
    }
    return [informationService, newService];
  }
};
