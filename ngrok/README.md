# ngrok Testing Scripts

This folder contains scripts for exposing the local development server to the internet using ngrok.

## Prerequisites

1. **Install ngrok**:
   ```bash
   # macOS (Homebrew)
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Create a free ngrok account** at https://ngrok.com and authenticate:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Usage

1. **Start the frontend** (in the web app folder):
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Run the ngrok tunnel** (in a new terminal):
   ```bash
   ./ngrok/start-ngrok.sh
   ```

3. Copy the public URL from ngrok output (e.g., `https://xxxx.ngrok.io`) to share or test.

## Custom Port

By default, the script tunnels port 3000. To use a different port:
```bash
./ngrok/start-ngrok.sh 3001
```

## Notes

- The free ngrok tier provides temporary URLs that change on each restart
- For persistent URLs, consider a paid ngrok plan
- Press `Ctrl+C` to stop the tunnel
