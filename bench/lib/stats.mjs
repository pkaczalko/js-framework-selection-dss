import fs from 'node:fs';
import path from 'node:path';


export function median(values) {
  const xs = values
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
}

export function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function sleepWithHeartbeat(ms, log, label, everyMs = 15_000) {
  const totalSec = Math.round(ms / 1000);
  const start = Date.now();
  const end = start + ms;
  log(`${label} — start, czekam ${totalSec} s`);
  while (Date.now() < end) {
    const remaining = end - Date.now();
    await sleep(Math.min(everyMs, remaining));
    if (Date.now() < end) {
      log(`${label} — pozostało ~${Math.ceil((end - Date.now()) / 1000)} s`);
    }
  }
  log(`${label} — koniec (${Math.round((Date.now() - start) / 1000)} s)`);
}


export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isoNow() {
  return new Date().toISOString();
}


export function createLogger(logPath) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const stream = fs.createWriteStream(logPath, { flags: 'a' });
  const log = (msg) => {
    const line = `${isoNow()} ${msg}`;
    stream.write(`${line}\n`);
    console.log(line);
  };
  log.error = (msg, err) => {
    const stack = err?.stack || (err !== undefined ? String(err) : '');
    log(`ERROR ${msg}${stack ? `\n${stack}` : ''}`);
  };
  log.path = logPath;
  log.close = () => new Promise((resolve) => stream.end(resolve));
  return log;
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function toCsv(rows) {
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

export function bytesToMB(bytes) {
  return bytes === null || bytes === undefined ? null : bytes / (1024 * 1024);
}

export function round(value, digits = 1) {
  if (value === null || value === undefined) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
