# Market Indices Dashboard

## Run locally

Requires Node.js 18+.

```sh
npm install
npm run dev
```

Open the local URL printed by the server (normally http://127.0.0.1:5173).

The dev server provides `/api/indices` and fetches index quotes from Yahoo Finance, so the browser does not need a third-party API key. Each market clock shows its local index; the three U.S. cards share the S&P 500 and NASDAQ. Nine Yahoo quotes refresh every two minutes, with at most four requests in flight. Values flash green/red when they move and show the last close in muted text outside the regular session. Yahoo does not currently return a Bahrain index quote, so that card shows an unavailable placeholder. Yahoo Finance availability, rate limits, and exchange delays apply; this dashboard is informational and is not a trading data source.

