# Local Development Guide

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure environment variables are set in `.env`:

```env
COMMERCE_URL=
COMMERCE_ADMIN_USERNAME=
COMMERCE_ADMIN_PASSWORD=
```

3. Ensure shell scripts are executable:

```bash
chmod +x scripts/*.sh
```

## Development Options

### 1. Full-Stack Development (Frontend + Actions)

```bash
npm run start
```

This will:

- Start Vite dev server for frontend (<http://localhost:3000>)
- Start App Builder dev server for actions (<https://localhost:9080>)
- Enable hot reloading for both frontend and actions

### 2. Frontend-Only Development

```bash
npm run dev:ui
```

- Starts Vite dev server on <http://localhost:3000>
- Hot reloading for frontend changes

### 3. Actions-Only Development

```bash
# Interactive mode
npm run dev:actions

# Background mode
npm run start:bg
```

### Managing Background Server

```bash
# View logs
npm run logs

# Clear logs
npm run logs:clear
```

## Shell Scripts

The project uses several shell scripts to manage the development workflow:

### run-background.sh

Located in `scripts/run-background.sh`, this script:

- Manages the background process lifecycle
- Cleans up existing processes
- Removes build artifacts
- Manages log rotation
- Starts the server in background mode

### wait-for-server.sh

Located in `scripts/wait-for-server.sh`, this script:

- Implements startup detection
- Waits for build and server phases
- Provides visual progress feedback
- Times out after 60 seconds
- Returns appropriate exit codes

### test-api.sh

Located in `scripts/test-api.sh`, this script:

- Provides API testing functionality
- Supports multiple environments (dev/prod)
- Handles various testing options
- See [Testing Guide](testing.md) for details

### remove-debug.js

Located in `scripts/remove-debug.js`, this script:

- Removes debug logging statements from production code
- Processes specific files in actions/ directory
- Removes console.log and console.error statements
- Cleans up empty lines after removal
- Useful for preparing code for production deployment

## Port Usage

- Frontend (Vite): <http://localhost:3000>
- Actions (App Builder): <https://localhost:9080>
- Experience Cloud shell: <https://experience.adobe.com/?devMode=true#/custom-apps/?localDevUrl=https://localhost:9080>

## Troubleshooting

1. If actions aren't updating:

```bash
npm run clean
npm run dev:actions
```

2. If the background server isn't responding:

```bash
# Stop any running instances
pkill -f 'aio app dev'

# Start fresh
npm run start:bg
```

3. Common Issues:
   - Port 3000/9080 already in use: Stop other dev servers or change ports
   - Authentication errors: Check .env configuration
   - Action deployment fails: Check logs with `npm run logs`
   - Server not responding: Try stopping and restarting with background server commands
