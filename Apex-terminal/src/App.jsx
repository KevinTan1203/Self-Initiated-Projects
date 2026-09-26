import React, { useCallback, useEffect, useMemo, useState } from 'react';

const SOURCES = [
  ['bloomberg', 'BLOOMBERG'],
  ['cnbc', 'CNBC'],
  ['reuters', 'REUTERS'],
  ['wsj', 'WSJ'],
  ['business-insider', 'BUSINESS INSIDER'],
  ['marketwatch', 'MARKETWATCH'],
];
const TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'AMD', 'JPM'];
const SECTORS = ['technology', 'financials', 'energy', 'healthcare', 'consumer', 'industrials', 'crypto', 'macro', 'communication'];
const SENTIMENTS = ['all', 'bullish', 'bearish', 'neutral'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=260&fit=crop';
const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const MARKET_TICKERS = [
  { name: 'S&P 500', country: 'US', price: '5,952.31', change: '+0.34%' },
  { name: 'NASDAQ', country: 'US', price: '18,991.56', change: '-0.70%' },
  { name: 'DOW JONES', country: 'US', price: '42,280.57', change: '-1.39%' },
  { name: 'FTSE 100', country: 'UK', price: '8,715.25', change: '+0.28%' },
  { name: 'DAX', country: 'GERMANY', price: '23,628.15', change: '+0.41%' },
  { name: 'CAC 40', country: 'FRANCE', price: '7,824.60', change: '-0.19%' },
  { name: 'NIKKEI 225', country: 'JAPAN', price: '43,309.18', change: '+0.65%' },
  { name: 'HANG SENG', country: 'HONG KONG', price: '25,112.34', change: '-0.88%' },
  { name: 'SHANGHAI COMP.', country: 'CHINA', price: '3,861.52', change: '+0.17%' },
  { name: 'NIFTY 50', country: 'INDIA', price: '25,447.80', change: '+0.22%' },
  { name: 'S&P/ASX 200', country: 'AUSTRALIA', price: '8,723.60', change: '-0.31%' },
  { name: 'S&P/TSX', country: 'CANADA', price: '28,421.73', change: '+0.46%' },
  { name: 'KOSPI', country: 'S. KOREA', price: '3,508.74', change: '+1.12%' },
  { name: 'IBOVESPA', country: 'BRAZIL', price: '145,382.09', change: '-0.53%' },
  { name: 'US 10Y', country: 'BONDS', price: '4.38', change: '+1.41%' },
  { name: 'BRENT', country: 'ENERGY', price: '77.76', change: '-1.45%' },
  { name: 'BITCOIN', country: 'CRYPTO', price: '95,980', change: '+0.80%' },
];

const bullishWords = ['surge', 'rally', 'soar', 'gain', 'record', 'beat', 'growth', 'profit', 'bull', 'up', 'rise', 'jump', 'boost'];
const bearishWords = ['fall', 'drop', 'plunge', 'loss', 'cut', 'layoff', 'crisis', 'recession', 'bear', 'down', 'decline', 'crash', 'fear', 'squeeze'];
const sectorKeywords = {
  technology: ['tech', 'ai', 'software', 'chip', 'semiconductor', 'apple', 'nvidia', 'microsoft', 'google'],
  energy: ['oil', 'gas', 'energy', 'brent', 'opec', 'fuel', 'diesel'],
  financials: ['bank', 'finance', 'fed', 'rate', 'yield', 'jpm'],
  consumer: ['consumer', 'retail', 'amazon'],
  industrials: ['industrial', 'manufacturing'],
  crypto: ['bitcoin', 'crypto', 'btc', 'ethereum'],
  healthcare: ['health', 'pharma', 'biotech'],
  macro: ['economy', 'gdp', 'inflation', 'recession', 'jobs', 'employment'],
  communication: ['media', 'telecom', 'communication', 'advertising'],
};

function articleText(article) {
  return `${article.title || ''} ${article.description || ''}`;
}

function getSentiment(article) {
  const text = articleText(article).toLowerCase();
  const bullish = bullishWords.filter((word) => text.includes(word)).length;
  const bearish = bearishWords.filter((word) => text.includes(word)).length;
  return bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral';
}

function getTickers(text) {
  const known = [...TICKERS, 'BTC', 'ETH'];
  return known.filter((ticker) => new RegExp(`\\b${ticker}\\b`, 'i').test(text)).slice(0, 4);
}

function getSectors(text) {
  const normalized = text.toLowerCase();
  return Object.entries(sectorKeywords)
    .filter(([, words]) => words.some((word) => normalized.includes(word)))
    .map(([sector]) => sector)
    .slice(0, 3);
}

function timeAgo(dateString) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (seconds < 60) return 'JUST NOW';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} MIN AGO`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
}

function takeaway(article, sentiment) {
  const summary = (article.description || article.title || '').slice(0, 140);
  const prefix = sentiment === 'bearish' ? 'Negative pressure building' : sentiment === 'bullish' ? 'Positive catalyst' : 'Key development';
  return `${prefix} - ${summary}${summary.length >= 140 ? '…' : ''}`;
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function StoryCard({ article, bookmarked, onBookmark }) {
  const sentiment = getSentiment(article);
  const text = articleText(article);
  const tickers = getTickers(text);
  const sectors = getSectors(text);
  const source = (article.source?.name || 'NEWS').toUpperCase().slice(0, 16);

  async function shareArticle() {
    if (navigator.share) {
      await navigator.share({ title: article.title, url: article.url });
      return;
    }
    await navigator.clipboard.writeText(article.url);
  }

  return (
    <article className="story-card">
      <div className="card-header">
        <div>
          <span className="source-badge">{source}</span>
          <span className="time-ago">{timeAgo(article.publishedAt)}</span>
        </div>
        <span className={`sentiment-badge ${sentiment}`}>
          {sentiment === 'bullish' ? '↗' : sentiment === 'bearish' ? '↘' : '–'} {sentiment.toUpperCase()}
        </span>
      </div>
      <div className="card-body">
        <img
          className="card-img"
          src={article.urlToImage || FALLBACK_IMAGE}
          onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
          alt=""
          loading="lazy"
        />
        <div className="card-content">
          <h2 className="card-title">{article.title || 'Untitled'}</h2>
          <div className="ai-box">
            <div className="ai-label">✦ WIRE TAKEAWAY</div>
            <p className="ai-text">{takeaway(article, sentiment)}</p>
          </div>
          <div className="tags-row">
            {tickers.map((ticker) => <span className="mini-tag ticker" key={ticker}>${ticker}</span>)}
            {sectors.map((sector) => <span className="mini-tag sector" key={sector}>{sector.toUpperCase()}</span>)}
          </div>
          <div className="card-footer">
            <a className="market-impact" href={article.url} target="_blank" rel="noreferrer">Read story <span aria-hidden="true">↗</span></a>
            <div className="card-actions">
              <button className={`icon-btn ${bookmarked ? 'selected' : ''}`} type="button" title={bookmarked ? 'Remove bookmark' : 'Bookmark'} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={onBookmark}>
                {bookmarked ? '▣' : '▢'}
              </button>
              <button className="icon-btn" type="button" title="Share story" aria-label="Share story" onClick={() => shareArticle().catch(() => {})}>↗</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterGroup({ title, items, selected, onToggle, prefix = '' }) {
  return (
    <section className="filter-group">
      <h2 className="section-title">{title}</h2>
      <div className="tag-grid">
        {items.map(([value, label]) => (
          <button
            className={`tag ${selected.includes(value) ? 'active' : ''}`}
            key={value}
            type="button"
            aria-pressed={selected.includes(value)}
            onClick={() => onToggle(value)}
          >{prefix}{label}</button>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sourceFilters, setSourceFilters] = useState([]);
  const [tickerFilters, setTickerFilters] = useState([]);
  const [sectorFilters, setSectorFilters] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadNews = useCallback(async () => {
    if (!API_KEY) {
      setError('NewsAPI key is missing. Add VITE_NEWS_API_KEY to .env.local, then restart the dev server.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        q: 'finance OR markets OR stocks OR economy OR earnings OR oil OR bitcoin',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '50',
        apiKey: API_KEY,
      });
      const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        throw new Error(data.message || `NewsAPI returned ${response.status}`);
      }
      setArticles((data.articles || []).filter((article) => article.title && article.title !== '[Removed]'));
    } catch (fetchError) {
      setError(fetchError.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(loadNews, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadNews]);

  const visibleArticles = useMemo(() => articles.filter((article) => {
    const text = articleText(article).toLowerCase();
    const source = (article.source?.name || '').toLowerCase().replaceAll(' ', '-');
    const tickers = getTickers(articleText(article));
    const sectors = getSectors(articleText(article));
    return (!query || text.includes(query.toLowerCase()))
      && (sentimentFilter === 'all' || getSentiment(article) === sentimentFilter)
      && (!sourceFilters.length || sourceFilters.some((filter) => source.includes(filter)))
      && (!tickerFilters.length || tickerFilters.some((ticker) => tickers.includes(ticker)))
      && (!sectorFilters.length || sectorFilters.some((sector) => sectors.includes(sector)))
      && (!showBookmarks || bookmarks.has(article.url));
  }), [articles, bookmarks, query, sectorFilters, sentimentFilter, showBookmarks, sourceFilters, tickerFilters]);

  function toggleBookmark(articleUrl) {
    setBookmarks((current) => {
      const updated = new Set(current);
      if (updated.has(articleUrl)) updated.delete(articleUrl);
      else updated.add(articleUrl);
      return updated;
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="logo">
          <div className="logo-icon">A</div>
          <div><div className="logo-text">ApexWire.Terminal</div><div className="logo-sub">Live financial intelligence</div></div>
        </div>
        <div className="sources-pills" aria-label="Wire coverage">
          <span className="pill green-dot">GLOBAL MARKETS</span>
          <span className="pill green-dot">LIVE WIRE</span>
        </div>
        <div className="top-right">
          <button className={`bookmarks ${showBookmarks ? 'active' : ''}`} type="button" onClick={() => setShowBookmarks((value) => !value)}>
            BOOKMARKS <strong>{bookmarks.size}</strong>
          </button>
          <label className="auto-toggle">
            AUTO
            <button className={`toggle ${autoRefresh ? '' : 'off'}`} type="button" role="switch" aria-checked={autoRefresh} aria-label="Toggle five-minute auto refresh" onClick={() => setAutoRefresh((value) => !value)} />
            <span className="refresh-rate">5m</span>
          </label>
          <button className="refresh-btn" type="button" onClick={loadNews} disabled={loading}><span aria-hidden="true">↻</span> Refresh</button>
        </div>
      </header>

      <div className="ticker-bar">
        <div className="ticker-caption"><span className="ticker-live-dot" />GLOBAL MARKETS<span>SNAPSHOT</span></div>
        <div className="ticker-window" role="region" aria-label="International market index snapshot">
          <div className="ticker-track">
            <div className="ticker-group">
              {MARKET_TICKERS.map((ticker) => <Ticker key={ticker.name} {...ticker} />)}
            </div>
            <div className="ticker-group" aria-hidden="true">
              {MARKET_TICKERS.map((ticker) => <Ticker key={ticker.name} {...ticker} />)}
            </div>
          </div>
        </div>
      </div>

      <main className="main">
        <aside className="sidebar">
          <h2 className="section-title filters-title">FILTERS</h2>
          <label className="search-wrap">
            <span aria-hidden="true">⌕</span>
            <input className="search-box" type="search" placeholder="Search headlines, tickers..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>

          <FilterGroup title="Sources" items={SOURCES} selected={sourceFilters} onToggle={(value) => setSourceFilters((current) => toggleValue(current, value))} />
          <FilterGroup title="Tickers" items={TICKERS.map((ticker) => [ticker, `$${ticker}`])} selected={tickerFilters} onToggle={(value) => setTickerFilters((current) => toggleValue(current, value))} />
          <FilterGroup title="Sectors" items={SECTORS.map((sector) => [sector, sector.toUpperCase()])} selected={sectorFilters} onToggle={(value) => setSectorFilters((current) => toggleValue(current, value))} />

          <section className="filter-group">
            <h2 className="section-title">Sentiment</h2>
            <div className="sentiment-btns">
              {SENTIMENTS.map((sentiment) => (
                <button className={`sent-btn ${sentiment} ${sentimentFilter === sentiment ? 'active' : ''}`} type="button" key={sentiment} aria-pressed={sentimentFilter === sentiment} onClick={() => setSentimentFilter(sentiment)}>
                  {sentiment.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="content">
          <div className="content-header">
            <div><p className="eyebrow">MARKET INTELLIGENCE / LIVE FEED</p><h1 className="content-title">Live Financial Wire</h1></div>
            <div className="story-count"><span className="live-dot" />{visibleArticles.length} of {articles.length} stories <span className="enriched-label">· enriched</span></div>
          </div>
          <div className="feed" aria-live="polite">
            {loading && <div className="loading"><div className="spinner" />{articles.length ? 'Refreshing live financial wire...' : 'Connecting to the live financial wire...'}</div>}
            {!loading && error && <div className="loading error-state"><strong>Unable to load the wire</strong><span>{error}</span></div>}
            {!loading && !error && visibleArticles.length === 0 && <div className="loading">{articles.length ? 'No stories match these filters.' : 'No stories found. Try refreshing.'}</div>}
            {!error && visibleArticles.map((article) => (
              <StoryCard key={article.url || article.title} article={article} bookmarked={bookmarks.has(article.url)} onBookmark={() => toggleBookmark(article.url)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Ticker({ name, country, price, change }) {
  const down = change.startsWith('-');
  return (
    <div className="ticker-item">
      <div className="ticker-instrument"><span className="ticker-name">{name}</span><span className="ticker-country">{country}</span></div>
      <span className="ticker-price">{price}</span>
      <span className={`ticker-change ${down ? 'down' : 'up'}`}>{down ? '↘' : '↗'} {change}</span>
    </div>
  );
}