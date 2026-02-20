# Mobile Preview Setup

## Option 1: Using ngrok (Recommended - Bypasses Firewall)

ngrok creates a public URL that tunnels to your local server, bypassing firewall restrictions.

### Setup:
1. **Install ngrok:**
   - Visit https://ngrok.com/download
   - Or use Homebrew: `brew install ngrok`
   - Sign up for a free account at https://dashboard.ngrok.com

2. **Start the server with ngrok:**
   ```bash
   chmod +x start-server-ngrok.sh
   ./start-server-ngrok.sh
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and open it on your mobile device.

**Note:** The free ngrok URL changes each time you restart. For a permanent URL, upgrade to a paid plan.

---

## Option 2: Configure Firewall (macOS)

### Allow incoming connections on port 8000:

1. **System Settings Method:**
   - Open **System Settings** → **Network** → **Firewall**
   - Click **Options** or **Firewall Options**
   - Click **+** to add an application
   - Find and add **Python** or **Terminal**
   - Make sure it's set to **Allow incoming connections**

2. **Command Line Method:**
   ```bash
   # Allow Python through firewall
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/bin/python3
   ```

3. **Restart the server** after configuring firewall

---

## Option 3: Use USB Connection (Android)

If you have an Android device:

1. **Enable USB Debugging** on your Android device
2. **Connect via USB** to your computer
3. **Use Chrome's port forwarding:**
   - Open Chrome on your computer
   - Go to `chrome://inspect`
   - Click **Port forwarding**
   - Add port `8000` → `localhost:8000`
   - On your mobile Chrome, navigate to `localhost:8000`

---

## Option 4: Use LocalTunnel (Alternative to ngrok)

1. **Install LocalTunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your server:**
   ```bash
   python3 server.py
   ```

3. **In another terminal, create tunnel:**
   ```bash
   lt --port 8000
   ```

4. **Use the provided URL** on your mobile device

---

## Quick Start (Regular Server)

If you've configured your firewall:

```bash
python3 server.py
```

Then use the network IP address shown in the terminal on your mobile device (make sure both devices are on the same Wi-Fi network).

