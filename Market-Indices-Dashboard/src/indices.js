const indicesByCity = {
  "Los Angeles": ["^GSPC", "^IXIC"],
  Chicago: ["^GSPC", "^IXIC"],
  "New York": ["^GSPC", "^IXIC"],
  London: ["^FTSE"],
  Manama: ["^BAX"],
  "New Delhi": ["^NSEI"],
  Tokyo: ["^N225"],
  Beijing: ["000001.SS"],
  "Hong Kong": ["^HSI"],
  Singapore: ["^STI"],
  Sydney: ["^AXJO"],
};
const labelsBySymbol = {
  "^STI": "STI",
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ",
  "^HSI": "Hang Seng",
  "^FTSE": "FTSE 100",
  "^BAX": "Bahrain All Share",
  "^NSEI": "NIFTY 50",
  "^N225": "Nikkei 225",
  "000001.SS": "SSE Composite",
  "^AXJO": "S&P/ASX 200",
};
const quotes = new Map();
const pendingFlashes = new Map();
const numberFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function createTextElement(className, text) {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = text;
  return element;
}

function renderMarketIndices() {
  document.querySelectorAll("#grid .card").forEach((card) => {
    const city = card.querySelector(".city")?.textContent;
    const symbols = indicesByCity[city];
    if (!symbols) {
      return;
    }

    card.querySelector(".market-indices")?.remove();
    card.classList.add("has-market-indices");
    const marketState = card.classList.contains("open")
      ? "open"
      : card.classList.contains("lunch")
        ? "lunch"
        : "closed";
    const marketIndices = document.createElement("div");
    marketIndices.className = "market-indices";

    for (const symbol of symbols) {
      const quote = quotes.get(symbol);
      const index = document.createElement("div");
      const isAvailable = quote && !quote.error;
      const isOpen = marketState === "open" && isAvailable && !quote.stale;
      index.className = `market-index${isOpen ? "" : " market-index--closed"}${isAvailable ? "" : " market-index--unavailable"}`;

      let stateLabel = "LAST CLOSE";
      if (!quote) {
        stateLabel = "LOADING QUOTE";
      } else if (quote.error) {
        stateLabel = "QUOTE UNAVAILABLE";
      } else if (quote.stale) {
        stateLabel = "STALE QUOTE";
      } else if (marketState === "open") {
        stateLabel = "SESSION OPEN";
      } else if (marketState === "lunch") {
        stateLabel = "LUNCH BREAK";
      }

      index.append(
        createTextElement("market-index-name", labelsBySymbol[symbol]),
        createTextElement("market-index-status", stateLabel),
        createTextElement(
          "market-index-value",
          isAvailable ? numberFormat.format(quote.price) : "--",
        ),
        createTextElement(
          "market-index-change",
          isAvailable
            ? `${quote.pct_change > 0 ? "+" : ""}${numberFormat.format(quote.pct_change)}%`
            : quote?.error || "Waiting for quote",
        ),
      );

      const flash = pendingFlashes.get(symbol);
      if (isOpen && flash) {
        index.classList.add(`market-index--flash-${flash}`);
        pendingFlashes.delete(symbol);
      } else if (!isOpen) {
        pendingFlashes.delete(symbol);
      }

      marketIndices.append(index);
    }

    card.append(marketIndices);
  });
}

function retainQuotesAsStale(message) {
  for (const symbol of Object.keys(labelsBySymbol)) {
    const quote = quotes.get(symbol);
    if (quote && !quote.error) {
      quotes.set(symbol, { ...quote, stale: true });
    } else {
      quotes.set(symbol, { symbol, error: message });
    }
    pendingFlashes.delete(symbol);
  }
}

async function updateIndices() {
  try {
    const response = await fetch("/api/indices");
    if (!response.ok) {
      throw new Error(`Market data request failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (
      !Array.isArray(data) ||
      data.length !== Object.keys(labelsBySymbol).length
    ) {
      throw new Error("Market data response has an invalid format");
    }

    for (const quote of data) {
      if (!Object.hasOwn(labelsBySymbol, quote.symbol)) {
        continue;
      }

      const previous = quotes.get(quote.symbol);
      if (quote.error) {
        quotes.set(
          quote.symbol,
          previous && !previous.error
            ? { ...previous, stale: true }
            : quote,
        );
        pendingFlashes.delete(quote.symbol);
        continue;
      }

      if (
        !Number.isFinite(quote.price) ||
        !Number.isFinite(quote.pct_change)
      ) {
        throw new Error(`Invalid quote returned for ${quote.symbol}`);
      }

      const movement =
        previous && !previous.error && !previous.stale
          ? quote.price - previous.price
          : 0;
      if (movement !== 0) {
        pendingFlashes.set(quote.symbol, movement > 0 ? "up" : "down");
      } else {
        pendingFlashes.delete(quote.symbol);
      }
      quotes.set(quote.symbol, { ...quote, stale: false });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch market data";
    console.error(message);
    retainQuotesAsStale(message);
  }
}

const grid = document.getElementById("grid");
new MutationObserver(renderMarketIndices).observe(grid, { childList: true });
renderMarketIndices();
updateIndices();
setInterval(updateIndices, 120000);
