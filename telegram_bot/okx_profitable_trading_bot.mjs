// okx_profitable_trading_bot.mjs
// Optimized for profitability: conservative signals, wider TP/SL, limited DCA

import axios from 'axios';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { RSI, EMA, BollingerBands, ATR, Stochastic, OBV, MACD } from 'technicalindicators';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// --- Required envs
const REQUIRED = [
  'OKX_API_KEY', 'OKX_SECRET_KEY', 'OKX_PASSPHRASE', 
  'TELEGRAM_TOKEN', 'TELEGRAM_CHAT_ID', 'SYMBOLS', 
  'VOLUME_THRESHOLD_BTC_USDT', 'VOLUME_THRESHOLD_ETH_USDT',
  'GRID_STEP_MULTIPLIER_BTC_USDT', 'GRID_STEP_MULTIPLIER_ETH_USDT',
  'MIN_ATR_BTC_USDT', 'MIN_ATR_ETH_USDT'
];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '));
  process.exit(1);
}

// --- Config
const OKX_BASE = 'https://www.okx.com';
const PUBLIC_WS = 'wss://ws.okx.com:8443/ws/v5/public';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;
const SYMBOLS = process.env.SYMBOLS.split(',').map(s => s.trim()).filter(Boolean);

const DEMO_MODE = process.env.DEMO_MODE === '1';
const OKX_SIMULATED = process.env.OKX_SIMULATED === '1';

const MAX_POSITION = Number(process.env.MAX_POSITION || 0.005); // Reduced for lower risk
const MAX_DAILY_LOSS = Number(process.env.MAX_DAILY_LOSS || 0.02);
const MAX_PORTFOLIO_LOSS = 0.05;
const RSI_PERIOD = Number(process.env.RSI_PERIOD || 6);
const EMA_FAST_PERIOD = Number(process.env.EMA_FAST_PERIOD || 4);
const EMA_SLOW_PERIOD = Number(process.env.EMA_SLOW_PERIOD || 10);
const BB_PERIOD = Number(process.env.BB_PERIOD || 10);
const BB_STD_DEV = Number(process.env.BB_STD_DEV || 1.5);
const ATR_PERIOD = Number(process.env.ATR_PERIOD || 8);
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;
const VOLUME_THRESHOLD = {
  'BTC-USDT': Number(process.env.VOLUME_THRESHOLD_BTC_USDT || 2), // Lowered for more opportunities
  'ETH-USDT': Number(process.env.VOLUME_THRESHOLD_ETH_USDT || 50)
};
const GRID_STEP_MULTIPLIER = {
  'BTC-USDT': Number(process.env.GRID_STEP_MULTIPLIER_BTC_USDT || 6.0),
  'ETH-USDT': Number(process.env.GRID_STEP_MULTIPLIER_ETH_USDT || 8.0)
};
const MIN_ATR = {
  'BTC-USDT': Number(process.env.MIN_ATR_BTC_USDT || 30),
  'ETH-USDT': Number(process.env.MIN_ATR_ETH_USDT || 3)
};
const MIN_ORDER_VALUE_USDT = 10; // Lowered to allow smaller profitable trades
const MIN_SPREAD_PCT = 0.1;
const POSITION_TIMEOUT_MS = 45 * 60 * 1000;
const DCA_INTERVAL_MS = 20 * 60 * 1000;
const DCA_AMOUNT = 0.001;
const MAX_DCA_LAYERS = 2; // Reduced for profitability
const GRID_LEVELS = 4; // Increased for more levels in range

// --- Cache and State
const instrumentDetails = new Map();
const positions = new Map(SYMBOLS.map(s => [s, null]));
const gridOrders = new Map(SYMBOLS.map(s => [s, []]));
const dcaLastPurchase = new Map(SYMBOLS.map(s => [s, 0]));
const dcaCount = new Map(SYMBOLS.map(s => [s, 0]));
const history = [];
let dayStartBalance = 0, portfolioStartBalance = 0, dailyPnl = 0, readyToTrade = false;
let lastOrderTs = 0;
const rateLimit = async (ms = 500) => {
  const d = Date.now() - lastOrderTs;
  if (d < ms) await new Promise(r => setTimeout(r, ms - d));
  lastOrderTs = Date.now();
};

// Candle buffers & last seen per symbol
const candleBuf = new Map(SYMBOLS.map(s => [s, []]));
const lastSeenTs = new Map(SYMBOLS.map(s => [s, 0]));
const restPollers = new Map();
const restFallbackInterval = 5000;
const restFallbackTimeout = 30_000;

// --- Linear Regression for Grid Step Optimization
const trainingData = new Map(SYMBOLS.map(s => [s, { x: [], y: [] }]));
const historicalATR = [1.19197997, 0.64214782, 1.63300943, 4.42704224, 0.39353423, 2.13092313, 0.5773045, 1.87353122, 0.22042916, 1.20393101, 1.37026455, 0.45394737, 0.87780678, 7.59704065, 1.23572042, 0.58271646, 0.23991058, 4.60902297, 1.82563164];
function trainGridStepModel(symbol, atr, volRatio, optimalStep) {
  const data = trainingData.get(symbol);
  data.x.push([atr, volRatio]);
  data.y.push(optimalStep * 0.7);
  historicalATR.forEach(h => {
    data.x.push([h * MIN_ATR[symbol], volRatio]);
    data.y.push(GRID_STEP_MULTIPLIER[symbol] * 0.7);
  });
  if (data.x.length > 100) {
    data.x.shift();
    data.y.shift();
  }
  trainingData.set(symbol, data);
}

async function predictGridStep(symbol, atr, volRatio) {
  const data = trainingData.get(symbol);
  if (data.x.length < 10) {
    for (let i = data.x.length; i < 10; i++) {
      data.x.push([atr, volRatio]);
      data.y.push(GRID_STEP_MULTIPLIER[symbol] * 0.7);
    }
    trainingData.set(symbol, data);
  }
  try {
    const regression = new SimpleLinearRegression(data.x, data.y);
    const predicted = regression.predict([atr, volRatio]);
    return Math.max(0.05, Math.min(0.3, predicted));
  } catch (e) {
    log(`predictGridStep error for ${symbol}: ${e.message}, returning default ${GRID_STEP_MULTIPLIER[symbol]}`);
    return GRID_STEP_MULTIPLIER[symbol];
  }
}

// --- Logging
const logStream = fs.createWriteStream(path.join(__dirname, 'bot.log'), { flags: 'a' });
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

// --- Telegram
const tg = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
async function notify(text) {
  try { await tg.sendMessage(TELEGRAM_CHAT_ID, text); } catch (e) { log('TG send error: ' + e.message); }
}
tg.on('polling_error', e => log('TG polling error: ' + e.message));

// --- OKX signing
function signRequest(ts, method, requestPath, bodyString = '') {
  return crypto.createHmac('sha256', OKX_SECRET_KEY).update(ts + method.toUpperCase() + requestPath + bodyString).digest('base64');
}

// --- Helpers: Get instrument details
async function getInstrumentDetails(symbol) {
  if (instrumentDetails.has(symbol)) return instrumentDetails.get(symbol);
  const pathQ = `/api/v5/public/instruments?instType=SPOT&instId=${encodeURIComponent(symbol)}`;
  try {
    const { data } = await axios.get(OKX_BASE + pathQ, { timeout: 15000 });
    const inst = data?.data?.[0];
    if (!inst) throw new Error('No instrument data');
    const details = {
      minSz: parseFloat(inst.minSz || '0'),
      lotSz: parseFloat(inst.lotSz || '0.000001'),
      tickSz: parseFloat(inst.tickSz || '0.01'),
      baseCcy: inst.baseCcy,
      quoteCcy: inst.quoteCcy
    };
    instrumentDetails.set(symbol, details);
    log(`Instrument details for ${symbol}: minSz=${details.minSz}, lotSz=${details.lotSz}, tickSz=${details.tickSz}`);
    return details;
  } catch (e) {
    log(`getInstrumentDetails error for ${symbol}: ${e.message}`);
    return { minSz: symbol === 'BTC-USDT' ? 0.00001 : 0.0001, lotSz: 0.000001, tickSz: 0.01, baseCcy: 'BTC', quoteCcy: 'USDT' };
  }
}

// --- Helpers: Get current market price
async function getCurrentPrice(symbol, side) {
  const ts = new Date().toISOString();
  const pathQ = `/api/v5/market/ticker?instId=${encodeURIComponent(symbol)}`;
  const sig = signRequest(ts, 'GET', pathQ, '');
  try {
    const { data } = await axios.get(OKX_BASE + pathQ, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': sig,
        'OK-ACCESS-TIMESTAMP': ts,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
      }, timeout: 15000
    });
    const ticker = data?.data?.[0];
    if (!ticker) throw new Error('No ticker data');
    const bidPx = parseFloat(ticker.bidPx);
    const askPx = parseFloat(ticker.askPx);
    const lastPx = parseFloat(ticker.last);
    const price = lastPx || (side === 'buy' ? askPx : bidPx);
    log(`Fetched prices for ${symbol} (${side}): bidPx=${bidPx}, askPx=${askPx}, lastPx=${lastPx}, selected=${price} USDT`);
    return { price, spread: askPx - bidPx };
  } catch (e) {
    log(`getCurrentPrice error for ${symbol} (${side}): ${e.message}`);
    return null;
  }
}

// --- Helpers: Cancel all orders
async function cancelAllOrders(symbol, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const ts = new Date().toISOString();
    const requestPath = `/api/v5/trade/orders-pending?instType=SPOT&instId=${encodeURIComponent(symbol)}`;
    const sig = signRequest(ts, 'GET', requestPath, '');
    try {
      const { data } = await axios.get(OKX_BASE + requestPath, {
        headers: {
          'OK-ACCESS-KEY': OKX_API_KEY,
          'OK-ACCESS-SIGN': sig,
          'OK-ACCESS-TIMESTAMP': ts,
          'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
          'x-simulated-trading': OKX_SIMULATED ? '1' : '0'
        }, timeout: 15000
      });
      const orders = data?.data || [];
      if (!orders.length) {
        log(`No pending orders for ${symbol}`);
        gridOrders.set(symbol, []);
        return;
      }
      const cancelRequestPath = '/api/v5/trade/cancel-batch-orders';
      const body = orders.map(o => ({ instId: symbol, ordId: o.ordId }));
      const bodyStr = JSON.stringify(body);
      const cancelSig = signRequest(ts, 'POST', cancelRequestPath, bodyStr);
      const { data: cancelData } = await axios.post(OKX_BASE + cancelRequestPath, body, {
        headers: {
          'OK-ACCESS-KEY': OKX_API_KEY,
          'OK-ACCESS-SIGN': cancelSig,
          'OK-ACCESS-TIMESTAMP': ts,
          'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
          'Content-Type': 'application/json',
          'x-simulated-trading': OKX_SIMULATED ? '1' : '0'
        }, timeout: 15000
      });
      if (cancelData?.code === '0') {
        log(`Cancelled ${orders.length} orders for ${symbol}: ${JSON.stringify(cancelData)}`);
        await notify(`🗑️ Cancelled ${orders.length} orders for ${symbol}`);
        gridOrders.set(symbol, []);
        return;
      } else {
        log(`Cancel orders error for ${symbol}: ${JSON.stringify(cancelData)}`);
        await notify(`⛔️ Cancel orders failed for ${symbol}: ${JSON.stringify(cancelData)}`);
      }
    } catch (e) {
      log(`Cancel orders exception for ${symbol}: ${e.message}, response: ${e.response ? JSON.stringify(e.response.data) : 'no response'}`);
      await notify(`⛔️ Cancel orders failed for ${symbol}: ${e.message}`);
      if (i === retries - 1) return;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// --- Helpers: REST history fallback
async function fetchLatestCandle(symbol, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const ts = new Date().toISOString();
      const pathQ = `/api/v5/market/history-candles?instId=${encodeURIComponent(symbol)}&bar=1m&limit=30`;
      const sig = signRequest(ts, 'GET', pathQ, '');
      const { data } = await axios.get(OKX_BASE + pathQ, {
        headers: {
          'OK-ACCESS-KEY': OKX_API_KEY,
          'OK-ACCESS-SIGN': sig,
          'OK-ACCESS-TIMESTAMP': ts,
          'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        }, timeout: 15000
      });
      const arr = data?.data || [];
      if (!arr.length) throw new Error('No candle data');
      return arr.map(c => ({
        ts: Number(c[0]),
        open: isNaN(+c[1]) ? 0 : +c[1],
        high: isNaN(+c[2]) ? 0 : +c[2],
        low: isNaN(+c[3]) ? 0 : +c[3],
        close: isNaN(+c[4]) ? 0 : +c[4],
        volume: isNaN(+c[5]) ? 0 : +c[5]
      })).reverse();
    } catch (e) {
      log(`fetchLatestCandle retry ${i+1}/${retries} error: ${e.message}`);
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// --- Trading helpers
async function getBalanceUSDT(retries = 3) {
  for (let i = 0; i < retries; i++) {
    const ts = new Date().toISOString();
    const requestPath = '/api/v5/account/balance?ccy=USDT';
    const sig = signRequest(ts, 'GET', requestPath, '');
    const headers = {
      'OK-ACCESS-KEY': OKX_API_KEY,
      'OK-ACCESS-SIGN': sig,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
      ...(OKX_SIMULATED ? { 'x-simulated-trading': '1' } : {})
    };
    log(`getBalanceUSDT headers: ${JSON.stringify(headers)}`);
    try {
      const { data } = await axios.get(OKX_BASE + requestPath, {
        headers,
        timeout: 15000
      });
      log(`getBalanceUSDT response: ${JSON.stringify(data)}`);
      if (data.code !== '0') {
        log(`getBalanceUSDT error response: code=${data.code}, msg=${data.msg}`);
        return 0;
      }
      const bal = parseFloat(data?.data?.[0]?.details?.[0]?.cashBal || '0');
      log(`getBalanceUSDT success: balance=${bal} USDT`);
      return bal;
    } catch (e) {
      log(`getBalanceUSDT error: ${e.message}, response: ${e.response ? JSON.stringify(e.response.data) : 'no response'}`);
      if (i === retries - 1) return 0;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function placeOrder(symbol, side, sz, ordType = 'market', px) {
  if (!(sz > 0)) { log(`Skip order: invalid size ${sz} for ${symbol}`); return null; }
  const instDetails = await getInstrumentDetails(symbol);
  const minSz = instDetails.minSz || (symbol === 'BTC-USDT' ? 0.00001 : 0.0001);
  const lotSz = instDetails.lotSz || 0.000001;
  let szAdjusted = sz;
  let isQuote = false;

  const priceData = await getCurrentPrice(symbol, side);
  if (!priceData) {
    log(`Skip order: failed to fetch price for ${symbol} (${side})`);
    return null;
  }
  const { price, spread } = priceData;
  if (spread / price * 100 > MIN_SPREAD_PCT) {
    log(`Skip order: spread ${spread} (${(spread/price*100).toFixed(2)}%) too high for ${symbol}`);
    return null;
  }

  if (ordType === 'market' && side === 'buy') {
    szAdjusted = sz * price * 1.005;
    isQuote = true;
    log(`Converted market buy sz for ${symbol}: base sz=${sz}, price=${price}, quote sz=${szAdjusted}`);
  }

  szAdjusted = Number(Math.max(minSz, Math.round(szAdjusted / lotSz) * lotSz).toFixed(Math.log10(1 / lotSz)));

  if (szAdjusted < minSz) {
    log(`Skip order: adjusted sz ${szAdjusted} < min ${minSz} for ${symbol}`);
    return null;
  }

  const orderValue = szAdjusted * price;
  if (orderValue < MIN_ORDER_VALUE_USDT) {
    log(`Skip order: order value ${orderValue.toFixed(2)} USDT < min ${MIN_ORDER_VALUE_USDT} USDT for ${symbol}`);
    return null;
  }
  const ts = new Date().toISOString();
  const requestPath = '/api/v5/trade/order';
  const body = { 
    instId: symbol, 
    tdMode: 'cash', 
    side: side.toLowerCase(), 
    ordType, 
    sz: String(szAdjusted), 
    ...(ordType === 'limit' ? { px: String(px) } : {}) 
  };
  const bodyStr = JSON.stringify(body);
  const sig = signRequest(ts, 'POST', requestPath, bodyStr);
  log(`placeOrder request for ${symbol}: side=${side}, sz=${szAdjusted} (${isQuote ? 'quote' : 'base'}), price=${price}, value=${orderValue.toFixed(2)} USDT`);
  try {
    const { data } = await axios.post(OKX_BASE + requestPath, body, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': sig,
        'OK-ACCESS-TIMESTAMP': ts,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'Content-Type': 'application/json',
        ...(OKX_SIMULATED ? { 'x-simulated-trading': '1' } : {})
      }, timeout: 15000
    });
    if (data?.code === '0') {
      log(`placeOrder success for ${symbol}: ${JSON.stringify(data)}`);
      await notify(`✅ Order placed for ${symbol}: side=${side}, sz=${szAdjusted}, price=${price}`);
      return data;
    }
    log(`placeOrder response error: ${JSON.stringify(data)}`);
    await notify(`⛔️ Order failed for ${symbol}: ${JSON.stringify(data)}`);
    if (data?.data?.[0]?.sCode === '51020') {
      await notify(`⛔️ Order failed for ${symbol}: Size ${szAdjusted} too small. Minimum order value is ${MIN_ORDER_VALUE_USDT} USDT.`);
    }
    return null;
  } catch (e) {
    log(`placeOrder exception: ${e.message}, response: ${e.response ? JSON.stringify(e.response.data) : 'no response'}`);
    await notify(`⛔️ placeOrder failed for ${symbol}: ${e.message}`);
    return null;
  }
}

// --- Grid Trading
async function setupGrid(symbol, price, atr, bb, optimalStep) {
  if (atr < MIN_ATR[symbol]) {
    log(`Skipping grid setup for ${symbol}: ATR ${atr} too low, min ${MIN_ATR[symbol]}`);
    return;
  }
  const gridOrdersForSymbol = gridOrders.get(symbol) || [];
  if (gridOrdersForSymbol.length > 0) {
    log(`Grid already exists for ${symbol}, skipping setup`);
    return;
  }

  // Check for narrow BB for боковик
  const bbWidth = (bb.upper - bb.lower) / bb.middle * 100;
  if (bbWidth > 0.5) {
    log(`Skipping grid setup for ${symbol}: BB width ${bbWidth.toFixed(2)}% > 0.5%, not боковик`);
    return;
  }

  log(`Setting up grid for ${symbol}: price=${price}, atr=${atr}, optimalStep=${optimalStep}, bbWidth=${bbWidth.toFixed(2)}%`);

  const gridStep = atr * GRID_STEP_MULTIPLIER[symbol] * 1.2; // Increased for wider spacing, less trades
  const rangeMin = price - atr * 3;
  const rangeMax = price + atr * 3;

  const buyLevels = [];
  const sellLevels = [];
  for (let i = 1; i <= GRID_LEVELS; i++) {
    const buyPrice = price - i * gridStep;
    const sellPrice = price + i * gridStep;
    if (buyPrice >= rangeMin) buyLevels.push(buyPrice);
    if (sellPrice <= rangeMax) sellLevels.push(sellPrice);
  }

  const balance = await getBalanceUSDT();
  const qtyPerLevel = Number(Math.min(20 / price, (balance * MAX_POSITION) / price).toFixed(6));
  if (qtyPerLevel * price < MIN_ORDER_VALUE_USDT) {
    log(`Skip grid setup for ${symbol}: qtyPerLevel=${qtyPerLevel} too small, value=${(qtyPerLevel * price).toFixed(2)} < ${MIN_ORDER_VALUE_USDT}`);
    return;
  }

  for (const buyPrice of buyLevels) {
    await rateLimit();
    const res = await placeOrder(symbol, 'buy', qtyPerLevel, 'limit', buyPrice);
    if (res) {
      gridOrdersForSymbol.push({ side: 'buy', price: buyPrice, qty: qtyPerLevel, ordId: res.data[0].ordId });
      log(`Grid BUY order placed for ${symbol} @ ${buyPrice}, qty=${qtyPerLevel}`);
      await notify(`Grid BUY order placed for ${symbol} @ ${buyPrice}`);
    }
  }
  for (const sellPrice of sellLevels) {
    await rateLimit();
    const res = await placeOrder(symbol, 'sell', qtyPerLevel, 'limit', sellPrice);
    if (res) {
      gridOrdersForSymbol.push({ side: 'sell', price: sellPrice, qty: qtyPerLevel, ordId: res.data[0].ordId });
      log(`Grid SELL order placed for ${symbol} @ ${sellPrice}, qty=${qtyPerLevel}`);
      await notify(`Grid SELL order placed for ${symbol} @ ${sellPrice}`);
    }
  }
  gridOrders.set(symbol, gridOrdersForSymbol);
}

async function manageGridOrders(symbol, currentPrice, atr) {
  const gridOrdersForSymbol = gridOrders.get(symbol);
  if (!gridOrdersForSymbol) return;

  log(`Managing grid for ${symbol}: currentPrice=${currentPrice}, atr=${atr}, orders=${JSON.stringify(gridOrdersForSymbol)}`);

  for (let i = gridOrdersForSymbol.length - 1; i >= 0; i--) {
    const order = gridOrdersForSymbol[i];
    if (order.side === 'buy' && currentPrice <= order.price) {
      const sellPrice = order.price + atr * GRID_STEP_MULTIPLIER[symbol] * 1.2;
      await rateLimit();
      const res = await placeOrder(symbol, 'sell', order.qty, 'limit', sellPrice);
      if (res) {
        const fee = order.qty * order.price * 0.001;
        const pnl = (sellPrice - order.price) * order.qty - fee;
        dailyPnl += pnl;
        gridOrdersForSymbol.push({ side: 'sell', price: sellPrice, qty: order.qty, ordId: res.data[0].ordId });
        log(`Grid BUY executed for ${symbol} @ ${order.price}, placed SELL @ ${sellPrice}, PNL=${pnl.toFixed(2)} USDT`);
        await notify(`Grid BUY executed for ${symbol} @ ${order.price}, placed SELL @ ${sellPrice}, PNL=${pnl.toFixed(2)} USDT`);
        gridOrdersForSymbol.splice(i, 1);
        history.push({ t: new Date().toISOString(), ts: Date.now(), symbol, action: `Grid BUY executed for ${symbol} @ ${order.price}, PNL=${pnl.toFixed(2)} USDT` });
      }
    } else if (order.side === 'sell' && currentPrice >= order.price) {
      const buyPrice = order.price - atr * GRID_STEP_MULTIPLIER[symbol] * 1.2;
      await rateLimit();
      const res = await placeOrder(symbol, 'buy', order.qty, 'limit', buyPrice);
      if (res) {
        const fee = order.qty * order.price * 0.001;
        const pnl = (order.price - buyPrice) * order.qty - fee;
        dailyPnl += pnl;
        gridOrdersForSymbol.push({ side: 'buy', price: buyPrice, qty: order.qty, ordId: res.data[0].ordId });
        log(`Grid SELL executed for ${symbol} @ ${order.price}, placed BUY @ ${buyPrice}, PNL=${pnl.toFixed(2)} USDT`);
        await notify(`Grid SELL executed for ${symbol} @ ${order.price}, placed BUY @ ${buyPrice}, PNL=${pnl.toFixed(2)} USDT`);
        gridOrdersForSymbol.splice(i, 1);
        history.push({ t: new Date().toISOString(), ts: Date.now(), symbol, action: `Grid SELL executed for ${symbol} @ ${order.price}, PNL=${pnl.toFixed(2)} USDT` });
      }
    }
  }
  gridOrders.set(symbol, gridOrdersForSymbol);
}

// --- WebSocket connect (disabled for now)
let wsClient = null;
function connectWS() {
  log('WebSocket disabled, using REST only');
}

// --- REST fallback poller
function startRestPoller(symbol) {
  if (restPollers.has(symbol)) return;
  log(`Starting REST poller for ${symbol}`);
  notify(`⚠️ WebSocket down for ${symbol}, switched to REST poller`);
  const id = setInterval(async () => {
    try {
      const candles = await fetchLatestCandle(symbol);
      if (!candles) return;
      const lastWsSeen = lastSeenTs.get(symbol) || 0;
      if (Date.now() - lastWsSeen > 5_000) {
        const buf = candleBuf.get(symbol);
        for (const latest of candles) {
          if (!buf.length || buf[buf.length-1].ts !== latest.ts) {
            buf.push({ close: latest.close, high: latest.high, low: latest.low, volume: latest.volume, ts: latest.ts });
            log(`REST fallback candle ${symbol} ts=${latest.ts} close=${latest.close}, buf size=${buf.length}`);
          }
        }
        const maxLen = Math.max(RSI_PERIOD, EMA_SLOW_PERIOD, BB_PERIOD, ATR_PERIOD, MACD_SLOW + MACD_SIGNAL) + 10;
        while (buf.length > maxLen) buf.shift();
        if (buf.length >= Math.max(RSI_PERIOD, EMA_SLOW_PERIOD, BB_PERIOD, ATR_PERIOD, MACD_SLOW) - 1) {
          await handleCandle(symbol, buf, buf[buf.length-1]);
        }
      }
    } catch (e) { log('REST poller error: '+e.message); }
  }, restFallbackInterval);
  restPollers.set(symbol, id);
}

setInterval(() => {
  for (const s of SYMBOLS) {
    const last = lastSeenTs.get(s) || 0;
    if (Date.now() - last > restFallbackTimeout) {
      if (!restPollers.has(s)) startRestPoller(s);
    }
  }
}, 5000);

// --- Candle handler
async function handleCandle(symbol, buf, item) {
  if (!readyToTrade) return;

  // Portfolio stop loss
  const balance = await getBalanceUSDT();
  if (portfolioStartBalance && balance < portfolioStartBalance * (1 - MAX_PORTFOLIO_LOSS)) {
    if (readyToTrade) {
      readyToTrade = false;
      await notify(`⛔️ Trading paused: Portfolio loss limit hit. Balance ${balance.toFixed(2)} USDT.`);
    }
    return;
  }

  if (DEMO_MODE) {
    const lastHist = history.length ? history[history.length-1] : null;
    if (lastHist && lastHist.ts === item.ts && lastHist.symbol === symbol) return;

    const qty = Number(Math.min(20 / item.close, (balance * MAX_POSITION) / item.close).toFixed(6));
    const pos = positions.get(symbol);

    if (!pos) {
      await rateLimit();
      const res = await placeOrder(symbol, 'buy', qty, 'market');
      if (res) {
        positions.set(symbol, { side: 'BUY', price: item.close, qty, ts: item.ts });
        const action = `[DEMO] BUY ${symbol} @ ${item.close}`;
        history.push({ t: new Date().toISOString(), ts: item.ts, symbol, action });
        log(action); await notify(action);
      }
    } else {
      await rateLimit();
      const res = await placeOrder(symbol, pos.side === 'BUY' ? 'sell' : 'buy', pos.qty, 'market');
      if (res) {
        const fee = pos.qty * item.close * 0.001;
        const pnl = (pos.side === 'BUY' ? (item.close - pos.price) : (pos.price - item.close)) * pos.qty - fee;
        dailyPnl += pnl;
        const action = `[DEMO] CLOSE ${symbol} PnL ${pnl.toFixed(2)} USDT`;
        history.push({ t: new Date().toISOString(), ts: item.ts, symbol, action });
        log(action); await notify(action);
        positions.set(symbol, null);
        dcaCount.set(symbol, 0); // Reset DCA
      }
    }
    return;
  }

  const minCandles = Math.max(RSI_PERIOD, EMA_SLOW_PERIOD, BB_PERIOD, ATR_PERIOD, MACD_SLOW) - 1;
  if (buf.length < minCandles) {
    log(`Not enough candles for ${symbol}: ${buf.length}/${minCandles}`);
    return;
  }

  const closes = buf.map(x => x.close).filter(x => typeof x === 'number' && !isNaN(x));
  const highs = buf.map(x => x.high).filter(x => typeof x === 'number' && !isNaN(x));
  const lows = buf.map(x => x.low).filter(x => typeof x === 'number' && !isNaN(x));
  const vols = buf.map(x => x.volume).filter(x => typeof x === 'number' && !isNaN(x));

  log(`Input data for ${symbol}: closes=${JSON.stringify(closes)}, highs=${JSON.stringify(highs)}, lows=${JSON.stringify(lows)}, vols=${JSON.stringify(vols)}`);

  if (closes.length < minCandles || highs.length < minCandles || lows.length < minCandles || vols.length < minCandles) {
    log(`Insufficient valid data for ${symbol}: closes=${closes.length}, highs=${highs.length}, lows=${vols.length}, required=${minCandles}`);
    return;
  }

  const emaFast = EMA.calculate({ values: closes.slice(-EMA_FAST_PERIOD), period: EMA_FAST_PERIOD }).slice(-1)[0];
  const emaSlow = EMA.calculate({ values: closes.slice(-EMA_SLOW_PERIOD), period: EMA_SLOW_PERIOD }).slice(-1)[0];
  const bb = BollingerBands.calculate({ values: closes.slice(-BB_PERIOD), period: BB_PERIOD, stdDev: BB_STD_DEV }).slice(-1)[0];

  let rsi, atr, macd, stochastic, obv;
  try {
    rsi = RSI.calculate({ values: closes.slice(-RSI_PERIOD-1), period: RSI_PERIOD }).slice(-1)[0];
    log(`RSI calculated for ${symbol}: rsi=${rsi}`);
  } catch (e) {
    log(`RSI calculation error for ${symbol}: ${e.message}`);
    rsi = undefined;
  }
  try {
    atr = ATR.calculate({ high: highs.slice(-ATR_PERIOD-1), low: lows.slice(-ATR_PERIOD-1), close: closes.slice(-ATR_PERIOD-1), period: ATR_PERIOD }).slice(-1)[0];
    log(`ATR calculated for ${symbol}: atr=${atr}`);
  } catch (e) {
    log(`ATR calculation error for ${symbol}: ${e.message}`);
    atr = undefined;
  }
  try {
    if (closes.length < MACD_SLOW + MACD_SIGNAL + 1) {
      log(`Not enough data for MACD on ${symbol}: ${closes.length}/${MACD_SLOW + MACD_SIGNAL + 1}`);
      macd = { MACD: 0, signal: 0 }; // Fallback
    } else {
      macd = MACD.calculate({
        values: closes.slice(-MACD_SLOW-1),
        fastPeriod: MACD_FAST,
        slowPeriod: MACD_SLOW,
        signalPeriod: MACD_SIGNAL
      }).slice(-1)[0];
      log(`MACD calculated for ${symbol}: macd=${macd.MACD}, signal=${macd.signal}`);
    }
  } catch (e) {
    log(`MACD calculation error for ${symbol}: ${e.message}`);
    macd = { MACD: 0, signal: 0 }; // Fallback
  }
  try {
    stochastic = Stochastic.calculate({
      high: highs.slice(-RSI_PERIOD-1),
      low: lows.slice(-RSI_PERIOD-1),
      close: closes.slice(-RSI_PERIOD-1),
      period: RSI_PERIOD,
      signalPeriod: 3
    }).slice(-1)[0];
    log(`Stochastic calculated for ${symbol}: stochK=${stochastic.k}`);
  } catch (e) {
    log(`Stochastic calculation error for ${symbol}: ${e.message}`);
    stochastic = undefined;
  }
  try {
    obv = OBV.calculate({
      close: closes.slice(-RSI_PERIOD-1),
      volume: vols.slice(-RSI_PERIOD-1)
    }).slice(-1)[0];
    log(`OBV calculated for ${symbol}: obv=${obv}`);
  } catch (e) {
    log(`OBV calculation error for ${symbol}: ${e.message}`);
    obv = undefined;
  }

  if (![emaFast, emaSlow, bb?.lower, bb?.upper].every(x => typeof x === 'number' && !isNaN(x))) {
    log(`Invalid core indicators for ${symbol}: emaFast=${emaFast}, emaSlow=${emaSlow}, bb=${JSON.stringify(bb)}`);
    return;
  }

  const price = closes[closes.length-1];
  const avgVol = vols.reduce((a,b) => a+b, 0) / Math.max(1, vols.length);
  const pos = positions.get(symbol);

  log(`Debug ${symbol}: rsi=${rsi}, price=${price}, bb.lower=${bb.lower}, bb.middle=${bb.middle}, emaFast=${emaFast}, emaSlow=${emaSlow}, stochK=${stochastic?.k}, obv=${obv}, macd=${macd?.MACD}, signal=${macd?.signal}, avgVol=${avgVol}`);

  const isSideways = atr && atr < 1.5 * MIN_ATR[symbol];
  const isUptrend = macd && macd.MACD > macd.signal && !isSideways;
  const isDowntrend = macd && macd.MACD < macd.signal && !isSideways;
  const isBuyConfirmed = emaFast > emaSlow && rsi < 25 && avgVol > VOLUME_THRESHOLD[symbol] && obv > 0 && (isUptrend || isSideways); // Tightened for profitability
  const isSellConfirmed = emaFast < emaSlow && rsi > 75 && avgVol > VOLUME_THRESHOLD[symbol] && obv < 0 && (isDowntrend || isSideways); // Tightened RSI to 75, OBV <0
  log(`Signals for ${symbol}: buy=${isBuyConfirmed}, sell=${isSellConfirmed}, uptrend=${isUptrend}, downtrend=${isDowntrend}`);

  const riskLimit = dayStartBalance ? dayStartBalance * (1 - MAX_DAILY_LOSS) : null;
  if (riskLimit && balance <= riskLimit) {
    if (readyToTrade) { 
      readyToTrade = false; 
      await notify(`⛔️ Trading paused: Daily loss limit hit. Balance ${balance.toFixed(2)} USDT.`); 
    }
    return;
  }

  const qty = Number(Math.min(20 / price, (balance * MAX_POSITION) / price).toFixed(6));

  const optimalStep = await predictGridStep(symbol, atr || 100, avgVol / price);
  await setupGrid(symbol, price, atr || 100, bb, optimalStep);
  await manageGridOrders(symbol, price, atr || 100);
  trainGridStepModel(symbol, atr || 100, avgVol / price, optimalStep);

  let dcaCnt = dcaCount.get(symbol) || 0;
  if (isBuyConfirmed && Date.now() - dcaLastPurchase.get(symbol) > DCA_INTERVAL_MS && dcaCnt < MAX_DCA_LAYERS && macd.MACD > 0) { // No DCA in downtrend
    const dcaQty = Number((balance * DCA_AMOUNT) / price).toFixed(6);
    log(`DCA check for ${symbol}: lastPurchase=${dcaLastPurchase.get(symbol)}, now=${Date.now()}, dcaCnt=${dcaCnt}`);
    await rateLimit();
    const res = await placeOrder(symbol, 'buy', dcaQty, 'market');
    if (res) {
      dcaLastPurchase.set(symbol, Date.now());
      dcaCount.set(symbol, dcaCnt + 1);
      log(`DCA BUY ${symbol} @ ${price}, qty=${dcaQty}, layer=${dcaCnt + 1}`);
      await notify(`DCA BUY ${symbol} @ ${price}, qty=${dcaQty}, layer=${dcaCnt + 1}`);
      const pos = positions.get(symbol);
      if (pos && pos.side === 'BUY') {
        const totalQty = pos.qty + dcaQty;
        const avgPrice = (pos.price * pos.qty + price * dcaQty) / totalQty;
        positions.set(symbol, { side: 'BUY', price: avgPrice, qty: totalQty, ts: item.ts });
      } else {
        positions.set(symbol, { side: 'BUY', price, qty: dcaQty, ts: item.ts });
      }
      history.push({ t: new Date().toISOString(), ts: item.ts, symbol, action: `DCA BUY ${symbol} @ ${price}` });
    }
  }

  let action = '';
  if (!pos && avgVol * price > VOLUME_THRESHOLD[symbol]) {
    if (isBuyConfirmed) {
      await rateLimit();
      const res = await placeOrder(symbol, 'buy', qty, 'market');
      if (res) {
        positions.set(symbol, { side: 'BUY', price, qty, ts: item.ts });
        action = `BUY ${symbol} @ ${price}`;
      }
    } else if (isSellConfirmed) {
      await rateLimit();
      const res = await placeOrder(symbol, 'sell', qty, 'market');
      if (res) {
        positions.set(symbol, { side: 'SELL', price, qty, ts: item.ts });
        action = `SELL ${symbol} @ ${price}`;
      }
    }
  }

  if (pos) {
    const newTrail = pos.side === 'BUY' ? price * (1 - 0.03) : price * (1 + 0.03); // Wider SL for profitability
    if (!pos.trail) pos.trail = newTrail; 
    else if (pos.side === 'BUY' && newTrail > pos.trail) pos.trail = newTrail; 
    else if (pos.side === 'SELL' && newTrail < pos.trail) pos.trail = newTrail;

    if ((pos.side === 'BUY' && (price <= pos.trail || price >= (pos.tp || (pos.price * 1.02)))) || // Wider TP
        (pos.side === 'SELL' && (price >= pos.trail || price <= (pos.tp || (pos.price * 0.98)))) ||
        (Date.now() - pos.ts > POSITION_TIMEOUT_MS)) {
      await rateLimit();
      const res = await placeOrder(symbol, pos.side === 'BUY' ? 'sell' : 'buy', pos.qty, 'market');
      if (res) {
        const fee = pos.qty * price * 0.001;
        const pnl = (pos.side === 'BUY' ? (price - pos.price) : (pos.price - price)) * pos.qty - fee;
        dailyPnl += pnl;
        action = `CLOSE ${symbol} PnL ${pnl.toFixed(2)} USDT`;
        positions.set(symbol, null);
        dcaCount.set(symbol, 0); // Reset DCA
        trainGridStepModel(symbol, atr || 100, avgVol / price, GRID_STEP_MULTIPLIER[symbol]);
      }
    }
  }

  if (action) { 
    history.push({ t: new Date().toISOString(), ts: item.ts, symbol, action }); 
    log(action); 
    await notify(action); 
  }
}

// --- Commands
tg.onText(/\/start/, (msg) => tg.sendMessage(msg.chat.id, `Bot online. Symbols: ${SYMBOLS.join(', ')}\nCommands: /status /history /clear /pause /resume /backtest /cancel`));

tg.onText(/\/status/, async (msg) => {
  const bal = await getBalanceUSDT();
  const posTxt = SYMBOLS.map(s => { 
    const p = positions.get(s); 
    return `${s}: ${p ? `${p.side} ${p.qty} @ ${p.price}, dca=${dcaCount.get(s)}` : '—'}`; 
  }).join('\n');
  tg.sendMessage(msg.chat.id, `Balance: ${bal.toFixed(2)} USDT\nDaily PnL: ${dailyPnl.toFixed(2)}\nReady: ${readyToTrade}\n${posTxt}`);
});

tg.onText(/\/history/, (msg) => {
  if (!history.length) return tg.sendMessage(msg.chat.id, 'No signals yet.');
  const text = history.slice(-20).map((e,i) => `#${i+1} ${e.t} ${e.symbol} ${e.action}`).join('\n');
  tg.sendMessage(msg.chat.id, text);
});

tg.onText(/\/clear/, (msg) => { history.length = 0; tg.sendMessage(msg.chat.id, 'History cleared.'); });
tg.onText(/\/pause/, (msg) => { readyToTrade = false; tg.sendMessage(msg.chat.id, 'Trading paused.'); });
tg.onText(/\/resume/, (msg) => { readyToTrade = true; tg.sendMessage(msg.chat.id, 'Trading resumed.'); });

tg.onText(/\/cancel/, async (msg) => {
  for (const s of SYMBOLS) {
    await cancelAllOrders(s);
  }
  tg.sendMessage(msg.chat.id, 'All orders cancelled.');
});

tg.onText(/\/backtest/, async (msg) => {
  tg.sendMessage(msg.chat.id, 'Running backtests…');
  for (const s of SYMBOLS) {
    const r = await backtest(s);
    const wr = r.trades ? (100 * r.wins / r.trades).toFixed(2) : '0.00';
    tg.sendMessage(msg.chat.id, `Backtest ${s}: trades=${r.trades}, WR=${wr}%, bal=${r.bal}`);
  }
});

// --- Backtest
async function fetchHistory(symbol) {
  const ts = new Date().toISOString();
  const requestPath = `/api/v5/market/history-candles?instId=${encodeURIComponent(symbol)}&bar=1m&limit=2000`;
  const sig = signRequest(ts, 'GET', requestPath, '');
  try {
    const { data } = await axios.get(OKX_BASE + requestPath, { headers: {
      'OK-ACCESS-KEY': OKX_API_KEY,
      'OK-ACCESS-SIGN': sig,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
    }, timeout: 15000 });
    const rows = (data?.data || []).slice().reverse();
    return rows.map(c => ({
      ts: Number(c[0]),
      open: isNaN(+c[1]) ? 0 : +c[1],
      high: isNaN(+c[2]) ? 0 : +c[2],
      low: isNaN(+c[3]) ? 0 : +c[3],
      close: isNaN(+c[4]) ? 0 : +c[4],
      volume: isNaN(+c[5]) ? 0 : +c[5]
    }));
  } catch(e){ log(`History ${symbol} error: ${e.message}`); return []; }
}

async function backtest(symbol) {
  const candles = await fetchHistory(symbol);
  if (candles.length === 0) return { trades:0, wins:0, bal:10_000 };
  let bal=10_000, trades=0, wins=0; const FEE=0.001; let pos=null;
  const maxLB = Math.max(RSI_PERIOD, EMA_SLOW_PERIOD, BB_PERIOD, ATR_PERIOD, MACD_SLOW);
  for (let i=maxLB; i<candles.length-1; i++) {
    const slice = candles.slice(i-maxLB, i);
    const closes = slice.map(x=>x.close).filter(x => typeof x === 'number' && !isNaN(x));
    const highs = slice.map(x=>x.high).filter(x => typeof x === 'number' && !isNaN(x));
    const lows = slice.map(x=>x.low).filter(x => typeof x === 'number' && !isNaN(x));
    const vols = slice.map(x=>x.volume).filter(x => typeof x === 'number' && !isNaN(x));
    if (closes.length < maxLB || highs.length < maxLB || lows.length < maxLB) continue;
    const emaF=EMA.calculate({ values: closes.slice(-EMA_FAST_PERIOD), period: EMA_FAST_PERIOD }).slice(-1)[0];
    const emaS=EMA.calculate({ values: closes.slice(-EMA_SLOW_PERIOD), period: EMA_SLOW_PERIOD }).slice(-1)[0];
    const rsi = RSI.calculate({ values: closes.slice(-RSI_PERIOD-1), period: RSI_PERIOD }).slice(-1)[0];
    const macd = MACD.calculate({
      values: closes.slice(-MACD_SLOW-1),
      fastPeriod: MACD_FAST,
      slowPeriod: MACD_SLOW,
      signalPeriod: MACD_SIGNAL
    }).slice(-1)[0];
    if (![emaF, emaS, rsi, macd?.MACD].every(x => typeof x === 'number' && !isNaN(x))) continue;
    const price = candles[i].close; 
    const avgVol = vols.reduce((a,b)=>a+b,0)/Math.max(1,vols.length);
    const qty = Math.min(20 / price, (bal*MAX_POSITION)/price);
    const isUptrend = macd.MACD > macd.signal;
    const isDowntrend = macd.MACD < macd.signal;
    const atr = ATR.calculate({ high: highs.slice(-ATR_PERIOD-1), low: lows.slice(-ATR_PERIOD-1), close: closes.slice(-ATR_PERIOD-1), period: ATR_PERIOD }).slice(-1)[0];
    const isSideways = atr < 1.5 * MIN_ATR[symbol];
    const obv = OBV.calculate({
      close: closes.slice(-RSI_PERIOD-1),
      volume: vols.slice(-RSI_PERIOD-1)
    }).slice(-1)[0];
    const spread = price * 0.001; // Simulate spread
    if (!pos && avgVol*price>VOLUME_THRESHOLD[symbol] && atr >= MIN_ATR[symbol]) {
      if (emaF>emaS && rsi<25 && obv > 0 && (isUptrend || isSideways)) { 
        const entryPrice = price * 1.0005; // Slippage
        pos={ side:'BUY', price: entryPrice, qty, sl: entryPrice*(1-0.03), tp: entryPrice*(1+0.02), ts: candles[i].ts }; 
        trades++; 
      }
      else if (emaF<emaS && rsi>75 && obv < 0 && (isDowntrend || isSideways)) { 
        const entryPrice = price * 0.9995; // Slippage
        pos={ side:'SELL', price: entryPrice, qty, sl: entryPrice*(1+0.03), tp: entryPrice*(1-0.02), ts: candles[i].ts }; 
        trades++; 
      }
    }
    if (pos) {
      const next = candles[i+1].close; 
      const fee = pos.qty*pos.price*FEE;
      if (pos.side==='BUY') { 
        if (next>=pos.tp || next<=pos.sl || (candles[i+1].ts - pos.ts > POSITION_TIMEOUT_MS)) { 
          const exitPrice = next * 0.9995; // Slippage
          const pnl=(exitPrice-pos.price)*pos.qty-fee; 
          bal+=pnl; 
          if (pnl>0) wins++; 
          pos=null; 
        } 
      }
      else { 
        if (next<=pos.tp || next>=pos.sl || (candles[i+1].ts - pos.ts > POSITION_TIMEOUT_MS)) { 
          const exitPrice = next * 1.0005; // Slippage
          const pnl=(pos.price-exitPrice)*pos.qty-fee; 
          bal+=pnl; 
          if (pnl>0) wins++; 
          pos=null; 
        } 
      }
    }
  }
  return { trades, wins, bal: Number(bal.toFixed(2)) };
}

// --- Daily reset
setInterval(async () => {
  dailyPnl = 0;
  dayStartBalance = await getBalanceUSDT();
  log('Daily reset with start balance ' + dayStartBalance);
}, 24 * 60 * 60 * 1000);

// --- Portfolio reset
setInterval(async () => {
  portfolioStartBalance = await getBalanceUSDT();
  log('Portfolio reset with start balance ' + portfolioStartBalance);
}, 7 * 24 * 60 * 60 * 1000); // Weekly

(async () => {
  log('Starting…');
  try { 
    dayStartBalance = await getBalanceUSDT(); 
    portfolioStartBalance = dayStartBalance; 
  } catch(_) {}
  for (const s of SYMBOLS) {
    await cancelAllOrders(s);
    gridOrders.set(s, []);
  }
  readyToTrade = true;
  connectWS();
  SYMBOLS.forEach(startRestPoller);
})();