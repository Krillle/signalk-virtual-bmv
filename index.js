// Signal K Plugin: signalk-virtual-bmv
// Full D-Bus service registration with value injection for BMV-602S

const dbus = require('dbus-next');
const { Variant } = dbus;
const DBusInterface = dbus.interface;

module.exports = function(app) {
  const plugin = {};
  let bus, interval;
  const VBUS_SERVICE = 'com.victronenergy.battery.ttyVirtualBMV';
  const OBJECT_PATH = '/com/victronenergy/battery/ttyVirtualBMV';

  plugin.id = 'signalk-virtual-bmv';
  plugin.name = 'Virtual Battery Monitor';
  plugin.description = 'Emulates a VE.Direct BMV 602S device by injecting battery data into the Victron Cerbo GX.';

  plugin.schema = {
    type: 'object',
    properties: {
      productName: {
        type: 'string',
        title: 'Product Name (shown in Venus/VRM)',
        default: 'Signal K Virtual BMV'
      },
      venusHost: {
        type: 'string',
        title: 'Venus OS hostname or IP',
        default: 'venus.local'
      },
      interval: {
        type: 'number',
        title: 'Update interval (ms)',
        default: 1000
      },
      paths: {
        type: 'object',
        title: 'Signal K paths to use',
        properties: {
          voltage: { type: 'string', default: 'electrical.batteries.0.voltage' },
          current: { type: 'string', default: 'electrical.batteries.0.current' },
          soc: { type: 'string', default: 'electrical.batteries.0.capacity.stateOfCharge' },
          timeToGo: { type: 'string', default: 'electrical.batteries.0.capacity.timeRemaining' },
          voltageStarter: { type: 'string', default: 'electrical.batteries.1.voltage' }
        }
      }
    }
  };

  plugin.start = async function(options) {
    app.setPluginStatus('Starting virtual BMV plugin');
    const { venusHost, paths, interval: updateInterval, productName } = options;
    const address = `tcp:host=${venusHost},port=78`;

    try {
      bus = dbus.createConnection({ busAddress: address });
      await bus.requestName(VBUS_SERVICE);

      bus.on('message', (msg) => {
        app.debug('DBus message:', msg);
      });
    } catch (err) {
      app.setPluginError(`Failed to connect to D-Bus: ${err.message}`);
      return;
    }

    const ifaceDesc = {
      name: 'com.victronenergy.BusItem',
      methods: {
        GetValue: ['()', 'v'],
        SetValue: ['v', 'b'],
        GetText: ['()', 's']
      },
      properties: {},
      signals: {
        PropertiesChanged: ['sa{sv}as']
      }
    };

    let values = {
      '/Mgmt/ProcessName': 'signalk-virtual-bmv',
      '/Mgmt/Connection': `tcp://${venusHost}`,
      '/Connected': 1,
      '/FirmwareVersion': '1.0',
      '/Dc/0/Voltage': 0,
      '/Dc/0/Current': 0,
      '/Soc': 0,
      '/TimeToGo': 0,
      '/Dc/1/Voltage': 0,
      '/ProductName': productName || 'BMV 602-S'
    };

    const interfaces = {};
    const labels = {
      '/Mgmt/ProcessName': 'Process Name',
      '/Mgmt/Connection': 'Connection Type',
      '/Connected': 'Connection Status',
      '/FirmwareVersion': 'Firmware Version',
      '/Dc/0/Voltage': 'Battery Voltage',
      '/Dc/0/Current': 'Battery Current',
      '/Soc': 'State of Charge',
      '/TimeToGo': 'Time Remaining',
      '/Dc/1/Voltage': 'Starter Voltage',
      '/ProductName': 'Device Name'
    };

    for (const path in values) {
      const variantType = typeof values[path] === 'string' ? 's' : 'd';
      interfaces[path] = DBusInterface(ifaceDesc, {
        _label: labels[path],
        _value: values[path],
        GetValue() {
          return new Variant(variantType, this._value);
        },
        SetValue(val) {
          this._value = val.value;
          return true;
        },
        GetText() {
          return this._label || '';
        }
      });
      bus.export(`${OBJECT_PATH}${path}`, interfaces[path]);
    }

    const getVal = (p) => {
      const v = app.getSelfPath(p);
      if (!v || v.value === undefined) {
        const msg = `Missing Signal K path: ${p}`;
        app.debug(msg);
        app.setPluginError(msg);
        return null;
      }
      return v.value;
    };

    interval = setInterval(() => {
      values['/Dc/0/Voltage'] = getVal(paths.voltage) || 0;
      values['/Dc/0/Current'] = getVal(paths.current) || 0;
      values['/Soc'] = getVal(paths.soc) || 0;
      values['/TimeToGo'] = getVal(paths.timeToGo) || 0;
      values['/Dc/1/Voltage'] = getVal(paths.voltageStarter) || 0;

      for (const path in values) {
        if (interfaces[path]) {
          interfaces[path]._value = values[path];
        }
      }

      const volts = values['/Dc/0/Voltage'].toFixed(2);
      const amps = values['/Dc/0/Current'].toFixed(1);
      const soc = values['/Soc'].toFixed(1);
      app.setPluginStatus(`Reporting: ${volts} V, ${amps} A, ${soc} % SoC`);
    }, updateInterval || 5000);
  };

  plugin.stop = async function() {
    if (interval) clearInterval(interval);
    if (bus) {
      for (const path in interfaces) {
        bus.unexport(`${OBJECT_PATH}${path}`);
      }
      await bus.disconnect();
    }
  };

  return plugin;
};
