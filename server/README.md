# Last Dinner – Email Collection API

Collects subscriber emails and stores them in `emails.json` for sending pitch decks and updates.

## Setup

```bash
cd server
npm install
```

## Run locally

```bash
npm start
```

Server runs at `http://localhost:3001`.

## API

- **POST /api/subscribe** – Add email  
  Body: `{ "email": "user@example.com" }`

- **GET /api/subscribers** – List all emails (for admin use)

## Deploying

1. Deploy this server to Railway, Render, Fly.io, or any Node host.
2. Set the `PORT` env var if needed.
3. Update `data-api-url` on the forms in `index.html` to your API URL, e.g.  
   `data-api-url="https://your-api.railway.app"`

## Data

Emails are stored in `emails.json` in the server directory. Export this file to use the list for sending pitch decks.
