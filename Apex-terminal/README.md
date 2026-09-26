# ApexWire.Terminal

React + Vite version of the ApexWire financial news terminal. The news feed is fetched directly from NewsAPI, so the browser origin must be localhost for a NewsAPI Developer plan.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `VITE_NEWS_API_KEY` to your NewsAPI key.
3. Start the app with `npm run dev` and open the localhost URL printed by Vite.

Restart the dev server after changing `.env.local`. Vite variables are included in the browser bundle; this setup is for local development only. For a deployed app, move the NewsAPI request to a server-side endpoint and keep the API key there.