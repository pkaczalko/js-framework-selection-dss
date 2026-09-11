
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FRAMEWORKS, RAW_DIR, REPO_ROOT, RESULTS_DIR } from '../config.mjs';
import { median, round, writeJson } from '../lib/stats.mjs';
import { CANONICAL_N20_RUNS } from './canonical-runs.mjs';

const FRAMEWORK_ORDER = FRAMEWORKS.map((f) => f.name);

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

function parseRunArg() {
  const arg = process.argv.find((a) => a.startsWith('--run='));
  if (!arg) {
    console.error('Użycie: node bench/results/extract-limit1000.mjs --run=run_<timestamp>_limit1000');
    process.exit(2);
  }
  const value = arg.split('=')[1];
  return value.startsWith('run_') ? value : `run_${value}`;
}

function readLhr(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function extractMetricValue(lhr, auditId) {
  const audit = lhr.audits?.[auditId];
  if (!audit) return null;
  if (audit.numericValue != null) return audit.numericValue;
  if (auditId === 'mainthread-work-breakdown' && audit.details?.items?.length) {
    const sum = audit.details.items.reduce((acc, item) => acc + (item.duration ?? 0), 0);
    return sum > 0 ? sum : null;
  }
  return null;
}

function collectLhrFiles(runDir) {
  const lighthouseDir = path.join(runDir, 'lighthouse');
  if (!fs.existsSync(lighthouseDir)) {
    throw new Error(`Brak katalogu LHR: ${lighthouseDir}`);
  }
  const files = fs.readdirSync(lighthouseDir).filter((f) => /^lighthouse_\w+_rep\d+\.json$/.test(f));
  const byFramework = {};
  for (const file of files) {
    const m = file.match(/^lighthouse_(\w+)_rep(\d+)\.json$/);
    if (!m) continue;
    const [, fw, rep] = m;
    if (!byFramework[fw]) byFramework[fw] = [];
    byFramework[fw].push({ rep: Number(rep), path: path.join(lighthouseDir, file) });
  }
  for (const fw of Object.keys(byFramework)) {
    byFramework[fw].sort((a, b) => a.rep - b.rep);
  }
  return byFramework;
}

function aggregateFrameworkMetrics(byFramework) {
  const out = {};
  for (const fw of FRAMEWORK_ORDER) {
    const entries = byFramework[fw] ?? [];
    out[fw] = {};
    for (const metric of METRICS) {
      const values = entries
        .map(({ path: p }) => extractMetricValue(readLhr(p), metric.id))
        .filter((v) => v != null && Number.isFinite(v));
      out[fw][metric.id] = {
        median: median(values),
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null,
        n: values.length,
        values,
      };
    }
  }
  return out;
}

function seriesMediansPerFramework(runIds) {
  const perRun = runIds.map((runId) => {
    const runDir = path.join(RAW_DIR, runId);
    const byFw = collectLhrFiles(runDir);
    return aggregateFrameworkMetrics(byFw);
  });
  const out = {};
  for (const fw of FRAMEWORK_ORDER) {
    out[fw] = {};
    for (const metric of METRICS) {
      const seriesMedians = perRun
        .map((run) => run[fw]?.[metric.id]?.median)
        .filter((v) => v != null && Number.isFinite(v));
      out[fw][metric.id] = {
        median: median(seriesMedians.length ? perRun.flatMap((run) => run[fw]?.[metric.id]?.values ?? []) : []),
        seriesMedians,
        spreadPct: spreadPercent(seriesMedians),
      };
    }
  }
  return out;
}

function spreadPercent(values) {
  if (!values.length || values.length < 2) return null;
  const med = median(values);
  if (med === 0) return med === values[0] ? 0 : 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return round(((max - min) / Math.abs(med)) * 100, 1);
}

function rankByMetric(aggregated, metricId) {
  const rows = FRAMEWORK_ORDER.map((fw) => ({
    framework: fw,
    value: aggregated[fw]?.[metricId]?.median,
  })).filter((r) => r.value != null);
  rows.sort((a, b) => a.value - b.value);
  const ranks = {};
  rows.forEach((row, index) => {
    ranks[row.framework] = index + 1;
  });
  return ranks;
}

function formatValue(value, unit) {
  if (value == null) return '—';
  if (unit === 'B') return Math.round(value).toLocaleString('pl-PL');
  if (unit === '') return round(value, 4).toString();
  return round(value, 2).toString();
}

function buildMedianTable(aggregated, title) {
  const lines = [`### ${title}`, ''];
  const header = ['Framework', ...METRICS.map((m) => m.label)];
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (const fw of FRAMEWORK_ORDER) {
    const cells = [fw, ...METRICS.map((m) => formatValue(aggregated[fw]?.[m.id]?.median, m.unit))];
    lines.push(`| ${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function buildComparisonTable(n20, n1000) {
  const lines = ['### Porównanie median N=20 vs N=1000', ''];
  for (const metric of METRICS) {
    lines.push(`#### ${metric.label}`);
    lines.push('');
    lines.push('| Framework | N=20 (mediana) | N=1000 (mediana) | Δ % | Ranga N=20 | Ranga N=1000 |');
    lines.push('|---|---:|---:|---:|---:|---:|');
    const ranks20 = rankByMetric(n20, metric.id);
    const ranks1000 = rankByMetric(n1000, metric.id);
    for (const fw of FRAMEWORK_ORDER) {
      const v20 = n20[fw]?.[metric.id]?.median;
      const v1000 = n1000[fw]?.[metric.id]?.median;
      let delta = '—';
      if (v20 != null && v1000 != null && v20 !== 0) {
        delta = `${round(((v1000 - v20) / Math.abs(v20)) * 100, 1)}%`;
      } else if (v20 === 0 && v1000 === 0) {
        delta = '0%';
      } else if (v20 === 0 && v1000 != null && v1000 > 0) {
        delta = '∞ (z 0)';
      }
      lines.push(
        `| ${fw} | ${formatValue(v20, metric.unit)} | ${formatValue(v1000, metric.unit)} | ${delta} | ${ranks20[fw] ?? '—'} | ${ranks1000[fw] ?? '—'} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function buildRankingChanges(n20, n1000) {
  const lines = ['## Zmiany rankingu N=20 → N=1000', ''];
  const changed = [];
  for (const metric of METRICS) {
    const r20 = rankByMetric(n20, metric.id);
    const r1000 = rankByMetric(n1000, metric.id);
    for (const fw of FRAMEWORK_ORDER) {
      if (r20[fw] != null && r1000[fw] != null && r20[fw] !== r1000[fw]) {
        changed.push(`- **${metric.label} · ${fw}:** ranga ${r20[fw]} → ${r1000[fw]}`);
      }
    }
  }
  lines.push(changed.length ? changed.join('\n') : 'Brak zmian rangi między N=20 a N=1000 dla żadnego frameworka/metryki.');
  lines.push('');

  const reactTbt20 = n20.react?.['total-blocking-time']?.median;
  const reactTbt1000 = n1000.react?.['total-blocking-time']?.median;
  lines.push('### TBT Reacta');
  lines.push('');
  if (reactTbt20 === 0 && reactTbt1000 === 0) {
    lines.push('TBT Reacta pozostaje **0 ms** w obu scenariuszach (próg 50 ms Lighthouse).');
  } else if (reactTbt20 === 0 && reactTbt1000 > 0) {
    lines.push(`TBT Reacta: **0 ms (N=20) → ${formatValue(reactTbt1000, 'ms')} ms (N=1000)** — przy dużej skali pojawiły się długie taski.`);
  } else {
    lines.push(`TBT Reacta: N=20 = ${formatValue(reactTbt20, 'ms')} ms, N=1000 = ${formatValue(reactTbt1000, 'ms')} ms.`);
  }
  lines.push('');

  const nextLcp20 = n20.next?.['largest-contentful-paint']?.median;
  const nextLcp1000 = n1000.next?.['largest-contentful-paint']?.median;
  const nuxtLcp20 = n20.nuxt?.['largest-contentful-paint']?.median;
  const nuxtLcp1000 = n1000.nuxt?.['largest-contentful-paint']?.median;
  lines.push('### LCP Next.js / Nuxt.js');
  lines.push('');
  lines.push(`- Next.js LCP: ${formatValue(nextLcp20, 'ms')} (N=20) → ${formatValue(nextLcp1000, 'ms')} (N=1000)`);
  lines.push(`- Nuxt.js LCP: ${formatValue(nuxtLcp20, 'ms')} (N=20) → ${formatValue(nuxtLcp1000, 'ms')} (N=1000)`);
  lines.push('');

  const svelteRank20Lcp = rankByMetric(n20, 'largest-contentful-paint').svelte;
  const svelteRank1000Lcp = rankByMetric(n1000, 'largest-contentful-paint').svelte;
  lines.push('### Svelte (LCP)');
  lines.push('');
  lines.push(`Ranga LCP: ${svelteRank20Lcp ?? '—'} (N=20) → ${svelteRank1000Lcp ?? '—'} (N=1000).`);
  lines.push('');

  return lines.join('\n');
}

function buildStabilitySection(n20Series) {
  const lines = ['## Stabilność (rozrzut międzyseryjny N=20, próg >15%)', ''];
  const flags = [];
  for (const fw of FRAMEWORK_ORDER) {
    for (const metric of METRICS) {
      const spread = n20Series[fw]?.[metric.id]?.spreadPct;
      if (spread != null && spread > 15) {
        const series = n20Series[fw][metric.id].seriesMedians.map((v) => formatValue(v, metric.unit)).join(' / ');
        flags.push(`- **${fw} · ${metric.label}:** rozrzut ${spread}% (mediany serii: ${series})`);
      }
    }
  }
  lines.push(flags.length ? flags.join('\n') : 'Żadna metryka N=20 nie przekroczyła progu 15% rozrzutu międzyseryjnego.');
  lines.push('');
  lines.push('Uwaga: pilot N=1000 to pojedyncza seria (5 powtórzeń) — rozrzut międzyseryjny liczony jest tylko dla baseline N=20 (4 serie).');
  lines.push('');
  return lines.join('\n');
}

function buildDeploymentSection() {
  const lines = ['## Model deployment (bez zmian względem protokołu klasy A)', ''];
  lines.push('| Framework | Tryb | Komenda startowa |');
  lines.push('|---|---|---|');
  const labels = {
    react: 'static CSR',
    vue: 'static CSR',
    svelte: 'static CSR',
    angular: 'static CSR',
    next: 'SSR (`next start`)',
    nuxt: 'SSR (Nitro, `nuxt preview`)',
  };
  for (const fw of FRAMEWORKS) {
    lines.push(`| ${fw.name} | ${labels[fw.name] ?? '?'} | \`${fw.startCmd}\` |`);
  }
  lines.push('');
  lines.push('Wyniki Next.js i Nuxt.js są reprezentatywne dla trybu SSR — bez przełączania na static export.');
  lines.push('');
  return lines.join('\n');
}

function buildInspectionSection() {
  return `## Inspekcja bench (KROK 0)

1. **Trasa:** \`measureTbtOnce\` przyjmuje \`scenarioPath\` (domyślnie \`TBT_SCENARIO_PATH=/?limit=20\`); pilot używa \`LARGE_SCENARIO_PATH=/?limit=1000\`.
2. **Zapis LHR:** \`lighthouse_{fw}_rep{n}.json\` w \`bench/results/raw/run_<ts>_limit1000/lighthouse/\`.
3. **Timeout:** domyślny Lighthouse \`maxWaitForLoad=45000\` ms; pilot N=1000 ustawia \`LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS=90000\` ms.

`;
}

function main() {
  const runName = parseRunArg();
  const runDir = path.join(RAW_DIR, runName);
  if (!fs.existsSync(runDir)) {
    throw new Error(`Nie znaleziono katalogu runu: ${runDir}`);
  }

  const byFw1000 = collectLhrFiles(runDir);
  const total1000 = Object.values(byFw1000).reduce((s, arr) => s + arr.length, 0);
  if (total1000 === 0) {
    throw new Error(`Brak plików LHR w ${path.join(runDir, 'lighthouse')}`);
  }

  const n1000 = aggregateFrameworkMetrics(byFw1000);
  const n20Flat = seriesMediansPerFramework(CANONICAL_N20_RUNS);
  const n20 = {};
  for (const fw of FRAMEWORK_ORDER) {
    n20[fw] = {};
    for (const metric of METRICS) {
      n20[fw][metric.id] = {
        median: n20Flat[fw][metric.id].median,
        n: n20Flat[fw][metric.id].seriesMedians.length * 5,
      };
    }
  }

  const ts = runName.replace(/^run_/, '').replace(/_limit1000$/, '');
  const summary = {
    generatedAt: new Date().toISOString(),
    pilotRun: runName,
    scenario: '/?limit=1000',
    baselineRuns: CANONICAL_N20_RUNS,
    lhrCount: { n1000: total1000, n20: CANONICAL_N20_RUNS.length * FRAMEWORK_ORDER.length * 5 },
    metrics: METRICS.map((m) => m.id),
    frameworks: n1000,
    baselineN20: Object.fromEntries(
      FRAMEWORK_ORDER.map((fw) => [fw, Object.fromEntries(METRICS.map((m) => [m.id, n20[fw][m.id]]))]),
    ),
  };
  writeJson(path.join(RESULTS_DIR, 'summary_limit1000.json'), summary);

  const reportLines = [
    `# Raport pilota Lighthouse N=1000 — ${runName}`,
    '',
    `Wygenerowano: ${summary.generatedAt}. Plików LHR N=1000: **${total1000}**. Baseline N=20: **${summary.lhrCount.n20}** plików (${CANONICAL_N20_RUNS.length} serie).`,
    '',
    buildInspectionSection(),
    '## Potwierdzenie trasy `/?limit=1000`',
    '',
    'Trasa działa bez adaptacji backendu — jest identyczna z `MEMORY_SCENARIO_PATH`, używaną przez `bench/memory/measure.mjs` w dotychczasowych seriach klasy A. Seed ≥1000 artykułów weryfikuje `preflightBackend` w `run-lighthouse-large.mjs`.',
    '',
    buildMedianTable(n1000, 'Mediany N=1000 per framework (9 metryk)'),
    buildComparisonTable(n20, n1000),
    buildRankingChanges(n20, n1000),
    buildStabilitySection(n20Flat),
    buildDeploymentSection(),
    '## Artefakty',
    '',
    `- Surowe LHR: \`${path.relative(REPO_ROOT, runDir)}\``,
    `- JSON: \`${path.relative(REPO_ROOT, path.join(RESULTS_DIR, 'summary_limit1000.json'))}\``,
    '',
  ];

  const reportPath = path.join(RESULTS_DIR, `report_limit1000_${ts}.md`);
  fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`);
  console.log(`summary: ${path.join(RESULTS_DIR, 'summary_limit1000.json')}`);
  console.log(`report:  ${reportPath}`);
  console.log(`LHR N=1000: ${total1000} plików`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
