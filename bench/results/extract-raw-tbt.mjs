

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, 'raw');

const FRAMEWORKS = ['react', 'angular', 'vue', 'svelte', 'next', 'nuxt'];

const SERIES = {
  N20: [
    '2026-08-19T12-22-44Z',
    '2026-08-19T13-54-49Z',
    '2026-08-19T16-04-43Z',
    '2026-08-19T17-43-28Z',
  ],
  N1000: [
    '2026-08-26T22-21-04Z_limit1000',
    '2026-08-27T03-11-00Z_limit1000',
    '2026-08-27T05-52-22Z_limit1000',
    '2026-08-27T06-46-07Z_limit1000',
  ],
};

const EXPECTED_PATH = { N20: '/?limit=20', N1000: '/?limit=1000' };

const METRICS = {
  tbt: 'total-blocking-time',
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbw: 'total-byte-weight',
};

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function quantile(values, q) {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (pos - lo) * (s[hi] - s[lo]);
}

const out = {};
const digests = new Map();
const warnings = [];

for (const [scenario, runIds] of Object.entries(SERIES)) {
  out[scenario] = {};
  for (const fw of FRAMEWORKS) {
    out[scenario][fw] = {};
    for (const key of Object.keys(METRICS)) out[scenario][fw][key] = { raw: [], perSeries: {} };
  }

  for (const runId of runIds) {
    const lhDir = join(RAW, `run_${runId}`, 'lighthouse');
    if (!existsSync(lhDir)) {
      warnings.push(`BRAK katalogu: ${lhDir}`);
      continue;
    }
    for (const file of readdirSync(lhDir).filter((f) => f.endsWith('.json'))) {
      const full = join(lhDir, file);
      const buf = readFileSync(full);

      const digest = createHash('md5').update(buf).digest('hex');
      if (digests.has(digest)) {
        warnings.push(`DUP_SKIPPED: ${file} == ${digests.get(digest)}`);
        continue;
      }
      digests.set(digest, file);

      const lhr = JSON.parse(buf.toString('utf8'));
      const fw = FRAMEWORKS.find((f) => file.includes(f));
      if (!fw) {
        warnings.push(`Nieznany framework w nazwie: ${file}`);
        continue;
      }

      const url = lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl ?? '';
      if (!url.includes(EXPECTED_PATH[scenario].replace('/', ''))) {
        warnings.push(`NIEZGODNY URL (${scenario}): ${file} -> ${url}`);
      }

      for (const [key, auditId] of Object.entries(METRICS)) {
        const value = lhr.audits?.[auditId]?.numericValue;
        if (typeof value !== 'number') {
          warnings.push(`BRAK ${key}: ${file}`);
          continue;
        }
        const rounded = Math.round(value * 10000) / 10000;
        out[scenario][fw][key].raw.push(rounded);
        (out[scenario][fw][key].perSeries[runId] ??= []).push(rounded);
      }
    }
  }

  for (const fw of FRAMEWORKS) {
    for (const key of Object.keys(METRICS)) {
      const e = out[scenario][fw][key];
      e.n = e.raw.length;
      e.pooledMedian = e.n ? median(e.raw) : null;
      e.seriesMedians = Object.fromEntries(
        Object.entries(e.perSeries).map(([k, v]) => [k, median(v)]),
      );
      e.medianOfMedians = e.n ? median(Object.values(e.seriesMedians)) : null;
      e.min = e.n ? Math.min(...e.raw) : null;
      e.max = e.n ? Math.max(...e.raw) : null;
      e.q1 = e.n ? quantile(e.raw, 0.25) : null;
      e.q3 = e.n ? quantile(e.raw, 0.75) : null;
    }
  }
}

const result = { generatedAt: new Date().toISOString(), series: SERIES, metrics: METRICS, warnings, data: out };
writeFileSync(join(HERE, 'raw_metryki_surowe.json'), JSON.stringify(result, null, 2), 'utf8');

for (const scenario of Object.keys(out)) {
  for (const key of Object.keys(METRICS)) {
    console.log(`\n=== ${scenario} / ${key} (${EXPECTED_PATH[scenario]}) ===`);
    for (const fw of FRAMEWORKS) {
      const e = out[scenario][fw][key];
      console.log(
        `${fw.padEnd(8)} n=${String(e.n).padStart(2)}  pooled=${String(e.pooledMedian).padStart(10)}` +
          `  medOfMed=${String(e.medianOfMedians).padStart(10)}  min=${e.min}  max=${e.max}`,
      );
    }
  }
}
console.log(`\nOstrzezenia (${warnings.length}):`);
for (const w of warnings) console.log('  - ' + w);
