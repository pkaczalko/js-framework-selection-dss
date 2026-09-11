
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import {
  API_URL,
  REPETITIONS,
  PAUSE_SAME_FRAMEWORK_SEC,
  MEMORY_SCENARIO_PATH,
  MEMORY_ARTICLE_SELECTOR,
  MEMORY_MIN_ARTICLES,
  MEMORY_RENDER_TIMEOUT_MS,
  MEMORY_SETTLE_MS,
  frameworkByName,
  frameworkOrigin,
} from '../config.mjs';
import { withChromeSession, browserURL } from '../lib/chrome-session.mjs';
import { median, randomIntInclusive, sleep, sleepWithHeartbeat, bytesToMB, round } from '../lib/stats.mjs';
import { startFramework, stopFramework, isPortFree } from '../lib/server-control.mjs';

function metricsByName(metrics) {
  return Object.fromEntries((metrics ?? []).map((m) => [m.name, m.value]));
}

function usedHeap(metrics) {
  return metricsByName(metrics).JSHeapUsedSize ?? null;
}

async function collectGarbageAndRead(cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  await sleep(500);
  const { metrics } = await cdp.send('Performance.getMetrics');
  return metrics;
}

const TRANSIENT_MEMORY = /Waiting failed|TimeoutError|timeout/i;
const MEMORY_ATTEMPTS = 3;

export async function measureMemoryOnce(fw, { repetition, log }) {
  let lastErr;
  for (let attempt = 1; attempt <= MEMORY_ATTEMPTS; attempt += 1) {
    try {
      return await measureMemoryOnceAttempt(fw, { repetition, log, attempt });
    } catch (err) {
      lastErr = err;
      const msg = err?.message || String(err);
      const retry = TRANSIENT_MEMORY.test(msg) && attempt < MEMORY_ATTEMPTS;
      log(
        `[${fw.name}] memory rep ${repetition}: próba ${attempt}/${MEMORY_ATTEMPTS} nieudana (${msg})` +
          `${retry ? ' — ponawiam ze świeżym Chrome' : ''}`,
      );
      if (!retry) throw err;
      await sleep(3000);
    }
  }
  throw lastErr;
}

async function measureMemoryOnceAttempt(fw, { repetition, log, attempt }) {
  const url = `${frameworkOrigin(fw)}${MEMORY_SCENARIO_PATH}`;
  const attemptTag = attempt > 1 ? ` (próba ${attempt}/${MEMORY_ATTEMPTS})` : '';
  log(`[${fw.name}] memory rep ${repetition}${attemptTag}: startuję Chrome → ${url} (czekam na ≥${MEMORY_MIN_ARTICLES} kart)`);
  return withChromeSession(async (chrome) => {
    log(`[${fw.name}] memory rep ${repetition}: Chrome na porcie ${chrome.port}, łączę Puppeteer…`);
    const browser = await puppeteer.connect({
      browserURL: browserURL(chrome),
      defaultViewport: { width: 1350, height: 940 },
    });
    try {
      const page = await browser.newPage();
      const consoleMessages = [];
      const failedRequests = [];
      const apiTraffic = [];
      page.on('console', (msg) => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
      });
      page.on('requestfailed', (req) => {
        failedRequests.push({
          url: req.url(),
          method: req.method(),
          error: req.failure()?.errorText ?? 'unknown',
        });
      });
      page.on('request', (req) => {
        if (req.url().includes('/articles')) {
          apiTraffic.push({ event: 'start', url: req.url(), at: Date.now() });
        }
      });
      page.on('response', (res) => {
        if (res.url().includes('/articles')) {
          apiTraffic.push({ event: 'end', url: res.url(), status: res.status(), at: Date.now() });
        }
      });

      const cdp = await page.createCDPSession();
      await page.goto(url, { waitUntil: 'load', timeout: MEMORY_RENDER_TIMEOUT_MS });
      log(`[${fw.name}] memory rep ${repetition}: load OK, czekam aż DOM ma ≥${MEMORY_MIN_ARTICLES} ${MEMORY_ARTICLE_SELECTOR}…`);

      try {
        await page.waitForFunction(
          (selector, min) => document.querySelectorAll(selector).length >= min,
          { timeout: MEMORY_RENDER_TIMEOUT_MS, polling: 500 },
          MEMORY_ARTICLE_SELECTOR,
          MEMORY_MIN_ARTICLES,
        );
      } catch (err) {
        let snapshot = { evaluateFailed: true };
        try {
          snapshot = await page.evaluate((selector) => {
            const app = document.querySelector('#app') || document.body;
            return {
              cards: document.querySelectorAll(selector).length,
              title: document.title,
              readyState: document.readyState,
              text: (app?.innerText || '').slice(0, 800),
            };
          }, MEMORY_ARTICLE_SELECTOR);
        } catch (evalErr) {
          snapshot = { evaluateFailed: evalErr.message };
        }
        log(
          `[${fw.name}] memory rep ${repetition}: timeout DOM — snapshot=${JSON.stringify(snapshot)} ` +
            `api=${JSON.stringify(apiTraffic)} ` +
            `console=${JSON.stringify(consoleMessages)} ` +
            `requestfailed=${JSON.stringify(failedRequests)}`,
        );
        throw err;
      }
      await sleep(MEMORY_SETTLE_MS);
      const articleCount = await page.evaluate(
        (selector) => document.querySelectorAll(selector).length,
        MEMORY_ARTICLE_SELECTOR,
      );
      if (articleCount < MEMORY_MIN_ARTICLES) {
        throw new Error(
          `[${fw.name}] po settle DOM ma ${articleCount} kart, oczekiwano ≥${MEMORY_MIN_ARTICLES} ` +
            `(prawdopodobny wyścig fetch — spóźniona odpowiedź nadpisała feed)`,
        );
      }

      await cdp.send('HeapProfiler.enable');
      await cdp.send('Performance.enable');

      const readings = [];
      readings.push(await collectGarbageAndRead(cdp));
      await sleep(1000);
      readings.push(await collectGarbageAndRead(cdp));
      const used1 = usedHeap(readings[0]);
      const used2 = usedHeap(readings[1]);
      if (used1 && used2 && Math.abs(used1 - used2) / used1 > 0.05) {
        log(
          `[${fw.name}] memory rep ${repetition}: Δ heap ${(100 * Math.abs(used1 - used2) / used1).toFixed(1)}% ` +
            `między GC#1 a GC#2 — trzeci odczyt`,
        );
        await sleep(1000);
        readings.push(await collectGarbageAndRead(cdp));
      }

      const metrics = readings[readings.length - 1];
      const named = metricsByName(metrics);
      const sample = {
        usedJSHeapBytes: named.JSHeapUsedSize ?? null,
        totalJSHeapBytes: named.JSHeapTotalSize ?? null,
        domNodes: named.Nodes ?? null,
        jsEventListeners: named.JSEventListeners ?? null,
        documents: named.Documents ?? null,
        articleCount,
        heapReadingsBytes: readings.map((r) => usedHeap(r)),
        metrics: named,
        url,
      };
      if (!sample.usedJSHeapBytes) {
        throw new Error(`[${fw.name}] Performance.getMetrics nie zwróciło JSHeapUsedSize`);
      }

      log(
        `[${fw.name}] memory rep ${repetition}: heapUsed=${round(bytesToMB(sample.usedJSHeapBytes), 2)} MB ` +
          `(odczyty ${sample.heapReadingsBytes.map((b) => round(bytesToMB(b), 2)).join(' → ')} MB), ` +
          `heapTotal=${round(bytesToMB(sample.totalJSHeapBytes ?? 0), 2)} MB, ` +
          `karty=${articleCount}, DOM nodes=${sample.domNodes}, listeners=${sample.jsEventListeners}`,
      );
      log(`[${fw.name}] memory rep ${repetition}: Performance.getMetrics ${JSON.stringify(named)}`);
      log(
        `[${fw.name}] memory rep ${repetition}: console[${consoleMessages.length}]=${JSON.stringify(consoleMessages)}`,
      );
      log(
        `[${fw.name}] memory rep ${repetition}: requestfailed[${failedRequests.length}]=${JSON.stringify(failedRequests)}`,
      );
      return sample;
    } finally {
      await browser.disconnect();
    }
  });
}

export async function measureMemorySeries(fw, { log, repetitions = REPETITIONS }) {
  const samples = [];
  for (let rep = 1; rep <= repetitions; rep += 1) {
    samples.push(await measureMemoryOnce(fw, { repetition: rep, log }));
    if (rep < repetitions) {
      const pauseSec = randomIntInclusive(...PAUSE_SAME_FRAMEWORK_SEC);
      await sleepWithHeartbeat(pauseSec * 1000, log, `[${fw.name}] pauza ${pauseSec} s między powtórzeniami memory (§4.2)`);
    }
  }
  const values = samples.map((s) => s.usedJSHeapBytes);
  return { values, medianBytes: median(values), samples };
}

async function main() {
  const fwArg = process.argv.find((a) => a.startsWith('--framework='));
  if (!fwArg) {
    console.error('Użycie: node bench/memory/measure.mjs --framework=<nazwa> [--reps=N]');
    process.exit(2);
  }
  const repsArg = process.argv.find((a) => a.startsWith('--reps='));
  const repetitions = repsArg ? Number(repsArg.split('=')[1]) : REPETITIONS;
  const fw = frameworkByName(fwArg.split('=')[1]);
  const log = (m) => console.log(`${new Date().toISOString()} ${m}`);

  try {
    const res = await fetch(`${API_URL}/articles?limit=1`);
    const body = await res.json();
    if ((body?.articlesCount ?? 0) < MEMORY_MIN_ARTICLES) {
      throw new Error(`backend ma ${body?.articlesCount ?? 0} artykułów, scenariusz memory wymaga ≥${MEMORY_MIN_ARTICLES}`);
    }
  } catch (err) {
    console.error(`Backend niedostępny lub niedoseedowany (${err.message}). Uruchom: cd backend; docker compose up -d; node .\\scripts\\seed-measure.mjs`);
    process.exit(1);
  }

  const reuse = !(await isPortFree(fw.port));
  const child = reuse ? null : await startFramework(fw, log);
  try {
    const out = await measureMemorySeries(fw, { log, repetitions });
    console.log(JSON.stringify({ framework: fw.name, values: out.values, medianBytes: out.medianBytes }, null, 2));
    console.log(`mediana usedJSHeap: ${round(bytesToMB(out.medianBytes), 2)} MB z ${out.values.length} powtórzeń`);
  } finally {
    if (child) await stopFramework(fw, child, log);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
