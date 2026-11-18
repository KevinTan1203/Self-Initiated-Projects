import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const indices = {
  "^STI": "Straits Times Index (SG)",
  "^GSPC": "S&P 500 (US)",
  "^IXIC": "NASDAQ Composite (US)",
  "^HSI": "Hang Seng Index (HK)",
  "^FTSE": "FTSE 100 (UK)",
  "^NSEI": "NIFTY 50 (India)",
  "^N225": "Nikkei 225 (Japan)",
  "000001.SS": "SSE Composite (China)",
  "^AXJO": "S&P/ASX 200 (Australia)",
};
const unavailableIndices = [
  {
    symbol: "^BAX",
    name: "Bahrain All Share Index",
    error: "Yahoo Finance has no quote for this index",
  },
];
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
let cachedResponse;
let pendingResponse;

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}

async function fetchIndex(symbol, name) {
  try {
    const url = new URL(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    );
    url.searchParams.set("range", "1d");
    url.searchParams.set("interval", "1m");

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.chart?.error) {
      throw new Error(
        payload.chart.error.description || "Yahoo Finance returned an error",
      );
    }

    const quote = payload.chart?.result?.[0];
    const price = quote?.meta?.regularMarketPrice;
    const previousClose =
      quote?.meta?.chartPreviousClose ?? quote?.meta?.previousClose;

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(previousClose) ||
      previousClose <= 0
    ) {
      throw new Error("Yahoo Finance did not return a usable quote");
    }

    const change = price - previousClose;
    return {
      symbol,
      name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      pct_change: Math.round((change / previousClose) * 10000) / 100,
    };
  } catch (error) {
    return {
      symbol,
      name,
      error: error instanceof Error ? error.message : "Data unavailable",
    };
  }
}

async function serveIndices(res) {
  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    sendJson(res, 200, cachedResponse.data);
    return;
  }

  if (!pendingResponse) {
    pendingResponse = fetchAllIndices()
      .then((data) => {
        cachedResponse = { data, expiresAt: Date.now() + 60000 };
        return data;
      })
      .finally(() => {
        pendingResponse = undefined;
      });
  }

  const data = await pendingResponse;
  sendJson(res, 200, data);
}

async function fetchAllIndices() {
  const entries = Object.entries(indices);
  const results = new Array(entries.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(4, entries.length) },
    async () => {
      while (nextIndex < entries.length) {
        const index = nextIndex++;
        const [symbol, name] = entries[index];
        results[index] = await fetchIndex(symbol, name);
      }
    },
  );

  await Promise.all(workers);
  return [...results, ...unavailableIndices];
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://127.0.0.1").pathname;

  if (pathname === "/api/indices") {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveIndices(res);
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end("Method not allowed");
    return;
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400);
    res.end("Invalid URL path");
    return;
  }

  const filePath = path.resolve(
    projectRoot,
    requestedPath === "/" ? "index.html" : `.${requestedPath}`,
  );
  const relativePath = path.relative(projectRoot, filePath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    console.error("Failed to serve dashboard file:", error);
    res.writeHead(500);
    res.end("Unable to serve dashboard file");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Market Indices Dashboard: http://127.0.0.1:${port}`);
});
