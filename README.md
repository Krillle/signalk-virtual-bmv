# Signal K Virtual BMV Plugin

Simulates a Victron BMV-602S battery monitor by injecting battery data from Signal K into Venus OS (Victron D-Bus) as a virtual device.

---

## ✅ Features

- Full D-Bus registration on the Cerbo GX
- Supports voltage, current, SoC, temperature, consumed Ah, time to go, starter voltage, relay state
- Exposes metadata (`/ProductName`, `/FirmwareVersion`, `/Mgmt/*`)
- Real-time status reporting to the Signal K dashboard
- Compatible with VRM and GX Touch interface

---

## 🔧 Requirements

- Signal K server running on a Raspberry Pi or similar device
- Victron Cerbo GX with Venus OS (on the same network)
- SSH access to the Cerbo GX
- D-Bus over TCP must be enabled:

```bash
dbus -y com.victronenergy.settings /Settings/Services/InsecureDbusOverTcp SetValue 1
```

---

## 📦 Installation

0. Enable SSH on the Cerbo GX

You can do this via:

- The **touchscreen**: Navigate to: **Settings → Remote Console → Enable SSH**

- The **web interface** at `http://venus.local` or the device IP: Go to **Settings → General → Enable SSH**

- Alternatively: Insert a USB stick with a file named `ssh` in the root directory and reboot the Cerbo.

Afterward, test with:

```bash
ssh root@venus.local
```

(Default user is `root`, no password needed by default.)

1. Clone or copy this plugin folder into:
   ```bash
   ~/.signalk/node_modules/signalk-virtual-bmv
   ```

2. Inside the plugin folder, install dependencies:
   ```bash
   npm install
   ```

3. Restart Signal K, then open the **Plugin Config** section in the Signal K web UI.

4. Enable **Virtual BMV** and configure the connection settings.

---

## ⚙️ Configuration Options

| Option               | Description                                      | Default                                  |
|----------------------|--------------------------------------------------|------------------------------------------|
| `venusHost`          | IP or hostname of the Cerbo GX                   | `venus.local`                            |
| `interval`           | Update interval in milliseconds                  | `5000`                                   |
| `productName`        | Name shown in VRM / Venus OS                     | `BMV 602-S`                              |
| `paths.voltage`      | Signal K path for battery voltage                | `electrical.batteries.0.voltage`         |
| `paths.current`      | Signal K path for battery current                | `electrical.batteries.0.current`         |
| `paths.soc`          | Signal K path for state of charge                | `electrical.batteries.0.soc`             |
| `paths.temp`         | Signal K path for battery temperature            | `electrical.batteries.0.temperature`     |
| `paths.consumedAh`   | Signal K path for consumed Ah                    | `electrical.batteries.0.capacity.consumed` |
| `paths.timeToGo`     | Signal K path for remaining time estimate        | `electrical.batteries.0.timeRemaining`   |
| `paths.voltageStarter` | Starter battery voltage path                 | `electrical.batteries.1.voltage`         |
| `paths.relayState`   | Relay state path                                 | `electrical.batteries.0.relay`           |

---

## 📡 Output

The plugin creates a virtual Victron D-Bus service:

```
com.victronenergy.battery.ttyVirtualBMV
```

This will appear in Venus OS as a second battery monitor (BMV), visible on the GX screen and in the VRM portal.

---

## 🧪 Testing

To verify D-Bus registration:

```bash
dbus-spy --host=venus.local --port=78
```

Or check on the Cerbo GX under:
**Settings → Services → Battery Monitor**

---

## 📝 License

MIT © Christian Wegerhoff
