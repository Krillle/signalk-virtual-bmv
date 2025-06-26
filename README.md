# Signal K Virtual BMV Plugin

Emulates a VE.direct battery monitor by injecting battery data from Signal K into Venus OS (Victron D-Bus) as a virtual device.

---

## Features

- Supports voltage, current, SoC, temperature, consumed Ah, time to go, starter voltage, relay state
- Real-time status reporting to the Signal K dashboard
- Compatible with VRM and GX Touch interface
- Exposes metadata '/Mgmt/ProcessName': 'signalk-virtual-device' to distinguish it from real devices

---

## Requirements

- Signal K server running on a Raspberry Pi or similar device
- Victron Cerbo GX with Venus OS (on the same network)
- SSH access to the Cerbo GX (see step 1)
- D-Bus over TCP must be enabled (see step 2)

---

## Installation

**1. Enable SSH on the Cerbo GX**

You can do this via:

- The **touchscreen**: Navigate to: **Settings → Remote Console → Enable SSH**

- The **web interface** at `http://venus.local` or the device IP: Go to **Settings → General → Enable SSH**

- Alternatively: Insert a USB stick with a file named `ssh` in the root directory and reboot the Cerbo.

Afterward, test with:

```bash
ssh root@venus.local
```

(Default user is `root`, no password needed by default.)


**2. Enable D-Bus over TCP on the Cerbo GX**

This step allows external devices (like your Raspberry Pi) to access the Victron D-Bus remotely via TCP on port 78. It is required so the plugin can simulate a BMV device over the network.

```bash
ssh root@venus.local
dbus -y com.victronenergy.settings /Settings/Services/InsecureDbusOverTcp SetValue 1
netstat -tuln | grep :78
```


**3. Install the plugin**

Look for `signalk-virtual-bmv`in the Signal K app store.  

To install manually, clone or copy the plugin folder into `~/.signalk/node_modules/signalk-virtual-bmv` and install dependecies with `npm install` inside the plugin folder.

**4. Restart Signal K server**

The plug in is enabled by default and should work right away with default settings. 

**Error "Venus OS not reachable: Connection timeout to Venus OS at venus.local:78"**

If you find **signalk-virtual-bmv** getting a timeout connecting to Venus OS, your Cerbo GX is not reachable at **venus.local**. Open the **Plugin Config** section in the Signal K web UI and configure the connection settings.

---

## Configuration Options

| Option               | Description                                      | Default                                  |
|----------------------|--------------------------------------------------|------------------------------------------|
| `venusHost`          | IP or hostname of the Cerbo GX                   | `venus.local`                            |
| `interval`           | Update interval in milliseconds                  | `1000`                                   |
| `productName`        | Name shown in VRM / Venus OS                     | `Signal K Virtual BMV`                   |
| `paths.voltage`      | Signal K path for battery voltage                | `electrical.batteries.0.voltage`         |
| `paths.current`      | Signal K path for battery current                | `electrical.batteries.0.current`         |
| `paths.soc`          | Signal K path for state of charge                | `electrical.batteries.0.soc`             |
| `paths.temp`         | Signal K path for battery temperature            | `electrical.batteries.0.temperature`     |
| `paths.consumedAh`   | Signal K path for consumed Ah                    | `electrical.batteries.0.capacity.consumed` |
| `paths.timeToGo`     | Signal K path for remaining time estimate        | `electrical.batteries.0.timeRemaining`   |
| `paths.voltageStarter` | Starter battery voltage path                   | `electrical.batteries.1.voltage`         |
| `paths.relayState`   | Relay state path                                 | `electrical.batteries.0.relay`           |

---

## Output

The plugin creates a virtual Victron D-Bus service:

```
com.victronenergy.battery.ttyVirtualBMV
```

This will appear in Venus OS as a second battery monitor (BMV), visible on the GX screen and in the VRM portal.

---

## Testing

To verify D-Bus registration:

```bash
dbus-spy --host=venus.local --port=78
```

Or check on the Cerbo GX under:
**Settings → Services → Battery Monitor**

---

MIT © Christian Wegerhoff
