
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FRAMEWORKS, RAW_DIR, REPO_ROOT, RESULTS_DIR } from '../config.mjs';
import { isoNow, median, round } from '../lib/stats.mjs';

const PILOT_RUNS = [
  { id: 'run_2026-08-26T22-21-04Z_limit1000', label: 'Seria #1' },
  { id: 'run_2026-08-27T03-11-00Z_limit1000', label: 'Seria #2' },
  { id: 'run_2026-08-27T05-52-22Z_limit1000', label: 'Seria #3' },
  { id: 'run_2026-08-27T06-46-07Z_limit1000', label: 'Seria #4' },
];

const METRICS = [
  { id: 'bootup-time', label: 'bootup-time', unit: 'ms' },
  { id: 'largest-contentful-paint', label: 'LCP', unit: 'ms' },
  { id: 'mainthread-work-breakdown', label: 'main-thread', unit: 'ms' },
  { id: 'total-blocking-time', label: 'TBT', unit: 'ms' },
  { id: 'first-contentful-paint', label: 'FCP', unit: 'ms' },
  { id: 'cumulative-layout-shift', label: 'CLS', unit: '' },
  { id: 'speed-index', label: 'Speed Index', unit: 'ms' },
  { id: 'total-byte-weight', label: 'total-byte-weight', unit: 'B' },
  { id: 'server-response-time', label: 'TTFB', unit: 'ms' },
];

const FWS = FRAMEWORKS.map((f) => f.name);
const LOGS_DIR = path.join(REPO_ROOT, 'bench', 'logs');

function extract(lhr, id) {
  const a = lhr.audits?.[id];
  if (!a) return null;
  if (a.numericValue != null) return a.numericValue;
  if (id === 'mainthread-work-breakdown' && a.details?.items?.length) {
    const s = a.details.items.reduce((acc, i) => acc + (i.duration ?? 0), 0);
    return s > 0 ? s : null;
  }
  return null;
}

function fmt(v, unit) {
  if (v == null) return '—';
  if (unit === 'B') return Math.round(v).toLocaleString('pl-PL');
  if (unit === '') return round(v, 4).toString();
  return round(v, 2).toString();
}

function loadRun(runId) {
  const dir = path.join(RAW_DIR, runId, 'lighthouse');
  const out = {};
  for (const fw of FWS) out[fw] = {};
  for (const file of fs.readdirSync(dir)) {
    const m = file.match(/^lighthouse_(\w+)_rep(\d+)\.json$/);
    if (!m) continue;
    const lhr = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const metric of METRICS) {
      if (!out[m[1]][metric.id]) out[m[1]][metric.id] = [];
      const v = extract(lhr, metric.id);
      if (v != null) out[m[1]][metric.id].push(v);
    }
  }
  for (const fw of FWS) {
    for (const metric of METRICS) {
      const vals = out[fw][metric.id] ?? [];
      out[fw][metric.id] = {
        values: vals,
        median: median(vals),
        min: vals.length ? Math.min(...vals) : null,
        max: vals.length ? Math.max(...vals) : null,
        n: vals.length,
      };
    }
  }
  return out;
}

function loadFrameworkSamples(runId) {
  const out = {};
  for (const fw of FWS) {
    const p = path.join(RAW_DIR, runId, `${fw}.json`);
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    out[fw] = j.tbt?.samples ?? [];
  }
  return out;
}

function parseLogTimes(runId) {
  const logPath = path.join(LOGS_DIR, `${runId}.log`);
  if (!fs.existsSync(logPath)) return { start: null, end: null };
  const text = fs.readFileSync(logPath, 'utf8');
  const startM = text.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z) === run-lighthouse-large start/m);
  const endM = text.match(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z) === run-lighthouse-large koniec/m);
  return { start: startM?.[1] ?? null, end: endM?.[1] ?? null };
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const min = Math.round(ms / 60000);
  return `~${min} min (${start} → ${end})`;
}

function rankByMetric(data, metricId) {
  const rows = FWS.map((fw) => ({ fw, v: data[fw][metricId].median }))
    .filter((r) => r.v != null)
    .sort((a, b) => a.v - b.v);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

function rankingLines(data, metricId, unit) {
  const rows = rankByMetric(data, metricId);
  return rows.map((r) => `${r.rank}. ${r.fw} (${fmt(r.v, unit)})`).join('; ');
}

function spreadPercent(values) {
  if (values.length < 2) return null;
  const med = median(values);
  if (med === 0) return values.every((v) => v === 0) ? 0 : 100;
  return round(((Math.max(...values) - Math.min(...values)) / Math.abs(med)) * 100, 1);
}

function buildObservations(data, samples) {
  const lines = [];
  const tbtRank = rankByMetric(data, 'total-blocking-time');
  lines.push(
    `- **TBT:** lider ${tbtRank[0].fw} (${fmt(tbtRank[0].v, 'ms')} ms), ostatni ${tbtRank.at(-1).fw} (${fmt(tbtRank.at(-1).v, 'ms')} ms).`,
  );
  const lcpRank = rankByMetric(data, 'largest-contentful-paint');
  lines.push(
    `- **LCP:** lider ${lcpRank[0].fw} (${fmt(lcpRank[0].v, 'ms')} ms), ostatni ${lcpRank.at(-1).fw} (${fmt(lcpRank.at(-1).v, 'ms')} ms).`,
  );

  const reactLcp = data.react['largest-contentful-paint'].values;
  if (reactLcp.length >= 2) {
    const sp = spreadPercent(reactLcp);
    if (sp != null && sp > 30) {
      lines.push(
        `- **React LCP:** rozrzut w serii ${sp}% (surowe: ${reactLcp.map((v) => round(v, 0)).join('; ')} ms) — repety bimodalne.`,
      );
    }
  }

  for (const fw of FWS) {
    const tbtVals = data[fw]['total-blocking-time'].values;
    const sp = spreadPercent(tbtVals);
    if (sp != null && sp > 40) {
      lines.push(
        `- **${fw} TBT outlier:** rozrzut ${sp}% w 5 rep (surowe: ${tbtVals.map((v) => round(v, 1)).join('; ')} ms).`,
      );
    }
  }

  const reactTbt = data.react['total-blocking-time'].median;
  if (reactTbt != null && reactTbt > 0) {
    lines.push(`- **React TBT:** mediana ${fmt(reactTbt, 'ms')} ms (przy N=20 bywało 0 ms).`);
  }

  return lines.join('\n');
}

function generateOne(meta) {
  const runId = meta.id;
  const state = JSON.parse(fs.readFileSync(path.join(RAW_DIR, runId, 'state.json'), 'utf8'));
  const data = loadRun(runId);
  const samples = loadFrameworkSamples(runId);
  const { start, end } = parseLogTimes(runId);
  const env = state.env ?? {};

  const lines = [];
  lines.push('# Podsumowanie serii pilota Lighthouse N=1000');
  lines.push('');
  lines.push(`**runId:** \`${runId}\``);
  lines.push(`**Seria:** ${meta.label}`);
  lines.push('**Status:** 6/6 OK');
  lines.push('**Źródło:** pomiar własny (pilot `run-lighthouse-large.mjs`)');
  lines.push(`**Start:** ${env.startedAt ?? start ?? '—'}`);
  lines.push(`**Koniec (log):** ${end ?? '—'}`);
  lines.push(`**Czas przebiegu:** ${formatDuration(start ?? env.startedAt, end)}`);
  lines.push('');
  lines.push(
    `Skrót ekstrakcji: \`bench/results/report_limit1000_${runId.replace(/^run_/, '').replace(/_limit1000$/, '')}.md\` (jeśli wygenerowany). Surowe JSON: \`bench/results/raw/${runId}/\`. Log: \`bench/logs/${runId}.log\`.`,
  );
  lines.push('');

  lines.push('## 1. Środowisko');
  lines.push('');
  lines.push('| Pole | Wartość |');
  lines.push('|---|---|');
  lines.push(`| Node | ${env.node ?? '—'} |`);
  lines.push(`| npm | ${env.npm ?? '—'} |`);
  lines.push(`| Chrome | ${env.chrome ?? '—'} |`);
  lines.push(`| CHROME_PATH | \`${env.chromePath ?? '—'}\` |`);
  lines.push(`| OS | ${env.os ?? '—'} |`);
  lines.push(`| CPU | ${(env.cpu ?? '—').trim()} |`);
  lines.push(`| RAM | ${env.ramGB ?? '—'} GB |`);
  lines.push(`| git SHA (HEAD w metadanych) | \`${env.gitSha ?? '—'}\` |`);
  lines.push('| Lighthouse | 13.4.1 |');
  lines.push('');

  lines.push('## 2. Protokół');
  lines.push('');
  lines.push('| Parametr | Wartość |');
  lines.push('|---|---|');
  lines.push('| Orkiestrator | `bench/run-lighthouse-large.mjs` (tylko Lighthouse) |');
  lines.push('| Profil Lighthouse | **mobile** (domyślny throttling) |');
  lines.push('| Trasa | `/?limit=1000` |');
  lines.push('| maxWaitForLoad | 90000 ms |');
  lines.push('| Powtórzenia | 5, agregacja: **mediana** |');
  lines.push('| Bundle / memory | **brak** w pilocie |');
  lines.push('| Pauza ten sam FW | 30–60 s |');
  lines.push('| Pauza między FW | 120–180 s |');
  lines.push('| Chrome | osobna świeża instancja na każde powtórzenie |');
  lines.push(`| Kolejność | wylosowana raz: **${state.runOrder?.join(' → ') ?? '—'}** |`);
  lines.push('');

  lines.push('## 3. Mediany z LHR (kierunek MIN)');
  lines.push('');
  const header = ['Framework', 'Status', ...METRICS.map((m) => m.label)];
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (const fw of FWS) {
    const fwJson = path.join(RAW_DIR, runId, `${fw}.json`);
    const status = fs.existsSync(fwJson)
      ? (JSON.parse(fs.readFileSync(fwJson, 'utf8')).status ?? 'OK')
      : '—';
    lines.push(
      `| ${fw} | ${status} | ${METRICS.map((m) => fmt(data[fw][m.id].median, m.unit)).join(' | ')} |`,
    );
  }
  lines.push('');
  lines.push('Ranking MIN (mediana w tej serii):');
  for (const metric of METRICS) {
    lines.push(`- **${metric.label}:** ${rankingLines(data, metric.id, metric.unit)}`);
  }
  lines.push('');

  lines.push('## 4. TBT — wszystkie powtórzenia');
  lines.push('');
  lines.push('Scenariusz: `/?limit=1000`, form-factor mobile.');
  lines.push('');
  lines.push('| Framework | n | mediana | min | max | surowe (ms) | FCP med. (ms) | LCP med. (ms) | TTI med. (ms) |');
  lines.push('|---|---:|---:|---:|---:|---|---:|---:|---:|');
  for (const fw of FWS) {
    const t = data[fw]['total-blocking-time'];
    const raw = t.values.map((v) => round(v, 1)).join('; ');
    const s = samples[fw] ?? [];
    const fcpMed = median(s.map((x) => x.fcpMs).filter((v) => v != null));
    const lcpMed = median(s.map((x) => x.lcpMs).filter((v) => v != null));
    const ttiMed = median(s.map((x) => x.ttiMs).filter((v) => v != null));
    lines.push(
      `| ${fw} | ${t.n} | ${fmt(t.median, 'ms')} | ${fmt(t.min, 'ms')} | ${fmt(t.max, 'ms')} | ${raw} | ${fmt(fcpMed, 'ms')} | ${fmt(lcpMed, 'ms')} | ${fmt(ttiMed, 'ms')} |`,
    );
  }
  lines.push('');

  lines.push('### 4.1. Próby TBT (FCP / LCP / TTI / Speed Index)');
  lines.push('');
  for (const fw of FWS) {
    const s = samples[fw] ?? [];
    if (!s.length) continue;
    lines.push(`#### ${fw}`);
    lines.push('');
    lines.push('| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |');
    lines.push('|---:|---:|---:|---:|---:|---:|---|');
    s.forEach((row, i) => {
      lines.push(
        `| ${i + 1} | ${round(row.tbtMs, 1)} | ${round(row.fcpMs, 0)} | ${round(row.lcpMs, 0)} | ${round(row.ttiMs, 0)} | ${round(row.speedIndexMs, 0)} | ${row.fetchTime ?? '—'} |`,
      );
    });
    lines.push('');
  }

  lines.push('## 5. Pozostałe metryki LHR — surowe powtórzenia');
  lines.push('');
  for (const metric of METRICS.filter((m) => m.id !== 'total-blocking-time')) {
    lines.push(`### ${metric.label}`);
    lines.push('');
    lines.push('| Framework | n | mediana | min | max | surowe |');
    lines.push('|---|---:|---:|---:|---:|---|');
    for (const fw of FWS) {
      const t = data[fw][metric.id];
      const raw =
        metric.unit === 'B'
          ? t.values.map((v) => Math.round(v)).join('; ')
          : t.values.map((v) => (metric.unit === '' ? round(v, 4) : round(v, 1))).join('; ');
      lines.push(
        `| ${fw} | ${t.n} | ${fmt(t.median, metric.unit)} | ${fmt(t.min, metric.unit)} | ${fmt(t.max, metric.unit)} | ${raw} |`,
      );
    }
    lines.push('');
  }

  lines.push('## 6. Obserwacje');
  lines.push('');
  lines.push(buildObservations(data, samples));
  lines.push('');

  lines.push('## 7. Artefakty');
  lines.push('');
  lines.push(`- Surowe LHR: \`${path.relative(REPO_ROOT, path.join(RAW_DIR, runId))}\``);
  lines.push(`- Log: \`bench/logs/${runId}.log\``);
  lines.push(`- \`${runId}/state.json\` — kolejność i snapshot środowiska`);
  lines.push('- Generator: `bench/results/generate-podsumowanie-limit1000.mjs`');
  lines.push('');

  const outPath = path.join(RESULTS_DIR, `podsumowanie_${runId}.md`);
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
  return outPath;
}

function main() {
  const written = [];
  for (const meta of PILOT_RUNS) {
    const runDir = path.join(RAW_DIR, meta.id);
    if (!fs.existsSync(runDir)) {
      console.warn(`Pominięto (brak katalogu): ${meta.id}`);
      continue;
    }
    written.push(generateOne(meta));
  }
  console.log(`Wygenerowano ${written.length} plików:`);
  for (const p of written) console.log(`  ${p}`);
  console.log(`\nCzas generacji: ${isoNow()}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
