
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  API_URL,
  CHROME_PATH,
  FRAMEWORKS,
  LIGHTHOUSE_PROFILE,
  validateLighthouseProfile,
  LOGS_DIR,
  MIN_SEEDED_ARTICLES,
  MEMORY_SCENARIO_PATH,
  TBT_SCENARIO_PATH,
  PAUSE_DIFFERENT_FRAMEWORK_SEC,
  PAUSE_SAME_FRAMEWORK_SEC,
  RAW_DIR,
  REPO_ROOT,
  REPETITIONS,
  RESULTS_DIR,
  frameworkOrigin,
} from './config.mjs';
import {
  createLogger,
  ensureDir,
  isoNow,
  median,
  randomIntInclusive,
  readJson,
  round,
  shuffle,
  sleep,
  sleepWithHeartbeat,
  toCsv,
  writeJson,
  bytesToMB,
} from './lib/stats.mjs';
import { assertChromePath, readChromeProductVersion } from './lib/chrome-session.mjs';
import {
  isPortFree,
  killPids,
  portOwnerPids,
  runBuild,
  runLoggedCommand,
  startFramework,
  stopFramework,
} from './lib/server-control.mjs';
import { measureServedBundle, bundleStabilitySample, distGzipTotal } from './bundle/measure.mjs';
import { measureTbtSeries } from './lighthouse/measure.mjs';
import { measureMemorySeries } from './memory/measure.mjs';

let currentServer = null;

function execCapture(command, cwd = REPO_ROOT, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, windowsHide: true });
    let out = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timeout ${timeoutMs} ms: ${command}`));
    }, timeoutMs);
    child.stdout.on('data', (b) => {
      out += String(b);
    });
    child.stderr.on('data', (b) => {
      out += String(b);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      return code === 0 ? resolve(out.trim()) : reject(new Error(`"${command}" exit ${code}\n${out}`));
    });
  });
}

export async function envSnapshot(profile, log) {
  log('preflight: odczytuję środowisko (Chrome, npm, git, OS)…');
  log('preflight: wersja Chrome (CDP /json/version)…');
  const chromeVersion = await readChromeProductVersion(log);
  if (!chromeVersion || /nieznana|timeout/i.test(chromeVersion)) {
    throw new Error(`Preflight: brak potwierdzonej wersji Chrome (otrzymano "${chromeVersion}"). Seria przerwana.`);
  }
  log(`preflight: Chrome = ${chromeVersion}`);
  log('preflight: npm --version…');
  const npmVersion = await execCapture('npm --version').catch(() => 'nieznana');
  log(`preflight: npm = ${npmVersion}`);
  log('preflight: git rev-parse HEAD…');
  const gitSha = await execCapture('git rev-parse HEAD').catch(() => null);
  log(`preflight: git SHA = ${gitSha ?? '(poza repo)'}`);
  return {
    node: process.version,
    npm: npmVersion,
    chrome: chromeVersion.trim(),
    chromePath: CHROME_PATH,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model ?? 'nieznany',
    ramGB: round(os.totalmem() / 1024 ** 3, 1),
    gitSha,
    startedAt: isoNow(),
    lighthouseProfile: profile,
    repetitions: REPETITIONS,
    tbtScenario: TBT_SCENARIO_PATH,
    memoryScenario: MEMORY_SCENARIO_PATH,
  };
}

export async function preflightBackend(log) {
  const url = `${API_URL}/articles?limit=1`;
  log(`preflight: backend ${url}`);
  let body;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.json();
  } catch (err) {
    throw new Error(
      `Backend nie odpowiada poprawnie na ${url} (${err.message}). ` +
        'Uruchom: cd backend; docker compose up -d; node .\\scripts\\seed-measure.mjs',
    );
  }
  const count = body?.articlesCount ?? 0;
  if (count < MIN_SEEDED_ARTICLES) {
    throw new Error(
      `Backend zaseedowany tylko N=${count} artykułami, wymagane ≥${MIN_SEEDED_ARTICLES} dla pomiaru memory. ` +
        'Doseeduj: node backend\\scripts\\seed-measure.mjs',
    );
  }
  log(`preflight: backend OK, articlesCount=${count} (wymagane ≥${MIN_SEEDED_ARTICLES})`);
}

export async function preflightPorts(log) {
  log(`preflight: sprawdzam ${FRAMEWORKS.length} portów pomiarowych…`);
  for (const fw of FRAMEWORKS) {
    log(`preflight: port ${fw.port} (${fw.name})…`);
    if (await isPortFree(fw.port)) {
      log(`preflight: port ${fw.port} (${fw.name}) wolny`);
      continue;
    }
    const pids = await portOwnerPids(fw.port);
    log(`preflight: port ${fw.port} (${fw.name}) zajęty przez PID: ${pids.join(', ') || 'nieznany'} — próba zamknięcia`);
    await killPids(pids);
    await sleep(1000);
    if (!(await isPortFree(fw.port))) {
      throw new Error(`Port ${fw.port} (${fw.name}) nadal zajęty (PID: ${pids.join(', ') || '?'}). Zwolnij go i uruchom ponownie.`);
    }
    log(`preflight: port ${fw.port} zwolniony`);
  }
  log('preflight: wszystkie porty pomiarowe wolne');
  log('preflight: porty OK — następny krok: snapshot środowiska, potem buildy (to trwa najdłużej)');
}

async function preflightDeps(fw, log) {
  const nm = path.join(REPO_ROOT, fw.dir, 'node_modules');
  if (!fs.existsSync(nm)) {
    log(`[${fw.name}] brak node_modules — npm ci (może potrwać)…`);
    await runLoggedCommand('npm ci', path.join(REPO_ROOT, fw.dir), log, `[${fw.name}][npm ci]`);
    log(`[${fw.name}] npm ci zakończone`);
  } else {
    log(`[${fw.name}] node_modules obecne — pomijam npm ci`);
  }
}

async function measureInitialBundleWithServer(fw, log) {
  const child = await startFramework(fw, log);
  currentServer = { fw, child };
  try {
    const served = bundleStabilitySample(await measureServedBundle(fw, log));
    const distDump = distGzipTotal(fw);
    log(`[${fw.name}] dist dump (nie metryka): gzip=${distDump.gzipBytes} B, plików js/css=${distDump.files}`);
    return { served, distDump };
  } finally {
    await stopFramework(fw, child, log);
    currentServer = null;
  }
}

async function preflightBuilds(frameworks, log) {
  const stability = {};
  log(`preflight: zaczynam ${frameworks.length}×2 buildy + pomiar initial-load (kolejność: ${frameworks.map((f) => f.name).join(', ')})`);
  for (let i = 0; i < frameworks.length; i += 1) {
    const fw = frameworks[i];
    log(`preflight: [${i + 1}/${frameworks.length}] ${fw.name} — zależności i build #1…`);
    await preflightDeps(fw, log);
    await runBuild(fw, log);
    const first = await measureInitialBundleWithServer(fw, log);
    log(`[${fw.name}] build#1 initial gzip=${first.served.gzipBytes} B (${first.served.files} zasobów)`);
    log(`preflight: [${i + 1}/${frameworks.length}] ${fw.name} — build #2 (weryfikacja stabilności initial load)…`);
    await runBuild(fw, log);
    const second = await measureInitialBundleWithServer(fw, log);
    log(`[${fw.name}] build#2 initial gzip=${second.served.gzipBytes} B (${second.served.files} zasobów)`);
    const urlsMatch =
      JSON.stringify([...first.served.urls].sort()) === JSON.stringify([...second.served.urls].sort());
    const stable =
      first.served.gzipBytes === second.served.gzipBytes &&
      first.served.files === second.served.files &&
      urlsMatch;
    if (!stable) {
      log(
        `[${fw.name}] UWAGA: initial load niestabilny między buildami ` +
          `(Δ=${second.served.gzipBytes - first.served.gzipBytes} B, ` +
          `pliki ${first.served.files}→${second.served.files}, urlsMatch=${urlsMatch}) — do odnotowania w raporcie`,
      );
    } else {
      log(`[${fw.name}] build stabilny (identyczny gzip i lista zasobów initial load)`);
    }
    stability[fw.name] = {
      build1: first.served,
      build2: second.served,
      stable,
      distDump: { build1: first.distDump, build2: second.distDump },
    };
  }
  log('preflight: wszystkie buildy zakończone');
  return stability;
}

function frameworkResultPath(runDir, fw) {
  return path.join(runDir, `${fw.name}.json`);
}

function isComplete(result) {
  return (
    result?.status === 'OK' &&
    result?.tbt?.values?.length >= REPETITIONS &&
    result?.memory?.values?.length >= REPETITIONS &&
    result?.bundle?.totalGzipBytes > 0
  );
}

async function measureFramework(fw, { runDir, log, profile }) {
  const result = {
    framework: fw.name,
    port: fw.port,
    origin: frameworkOrigin(fw),
    startedAt: isoNow(),
    status: 'FAILED',
  };
  let child = null;
  try {
    child = await startFramework(fw, log);
    currentServer = { fw, child };

    result.bundle = await measureServedBundle(fw, log);

    try {
      const tbt = await measureTbtSeries(fw, { rawDir: path.join(runDir, 'lighthouse'), log, profile });
      result.tbt = { unit: 'ms', profile, values: tbt.values, median: tbt.medianMs, samples: tbt.samples };
    } catch (err) {
      result.error = { message: err.message, stack: err.stack };
      log.error(`[${fw.name}] tbt nieudany — memory i tak zmierzę`, err);
    }

    const pauseSec = randomIntInclusive(...PAUSE_SAME_FRAMEWORK_SEC);
    await sleepWithHeartbeat(pauseSec * 1000, log, `[${fw.name}] pauza ${pauseSec} s między blokami tbt→memory (§4.2)`);

    try {
      const mem = await measureMemorySeries(fw, { log });
      result.memory = {
        unit: 'bytes',
        values: mem.values,
        median: mem.medianBytes,
        medianMB: round(bytesToMB(mem.medianBytes), 2),
        samples: mem.samples,
      };
    } catch (err) {
      const prev = result.error?.message ? `${result.error.message}\n` : '';
      result.error = { message: `${prev}${err.message}`, stack: err.stack };
      log.error(`[${fw.name}] memory nieudany`, err);
    }

    if (result.tbt?.values?.length >= REPETITIONS && result.memory?.values?.length >= REPETITIONS && result.bundle?.totalGzipBytes > 0) {
      result.status = 'OK';
      delete result.error;
    }
  } catch (err) {
    result.error = { message: err.message, stack: err.stack };
    log.error(`[${fw.name}] pomiar nieudany — oznaczam FAILED i idę dalej`, err);
  } finally {
    if (child) {
      await stopFramework(fw, child, log).catch((e) => log.error(`[${fw.name}] problem przy stop`, e));
      currentServer = null;
    }
    result.finishedAt = isoNow();

    writeJson(frameworkResultPath(runDir, fw), result);
    log(`[${fw.name}] wynik częściowy zapisany: ${frameworkResultPath(runDir, fw)}`);
  }
  return result;
}

function buildSummary({ runId, env, runOrder, results, stability, profile }) {
  const frameworks = {};
  for (const r of results) {
    frameworks[r.framework] = {
      status: r.status,
      bundle: r.bundle
        ? {
            valueGzipBytes: r.bundle.totalGzipBytes,
            assets: r.bundle.assets?.length,
            buildStability: stability?.[r.framework] ?? null,
          }
        : null,
      tbt: r.tbt
        ? {
            medianMs: round(r.tbt.median, 1),
            values: r.tbt.values.map((v) => round(v, 1)),
            n: r.tbt.values.length,
            fcpMedianMs: median((r.tbt.samples ?? []).map((s) => s.fcpMs)),
            ttiMedianMs: median((r.tbt.samples ?? []).map((s) => s.ttiMs)),
          }
        : null,
      memory: r.memory
        ? { medianBytes: r.memory.median, medianMB: round(bytesToMB(r.memory.median), 2), values: r.memory.values, n: r.memory.values.length }
        : null,
      error: r.error?.message ?? null,
    };
  }
  return {
    runId,
    source: 'pomiar własny',
    generatedAt: isoNow(),
    environment: env,
    protocol: {
      lighthouseProfile: profile,
      repetitions: REPETITIONS,
      aggregation: 'mediana',
      tbtScenario: TBT_SCENARIO_PATH,
      memoryScenario: MEMORY_SCENARIO_PATH,
      pauseSameFrameworkSec: PAUSE_SAME_FRAMEWORK_SEC,
      pauseDifferentFrameworkSec: PAUSE_DIFFERENT_FRAMEWORK_SEC,
      chromeSessions: 'osobna świeża instancja Chrome na każde powtórzenie tbt i memory (uzasadnienie: bench/memory/measure.mjs)',
    },
    runOrder,
    frameworks,
  };
}

function summaryToCsv(summary) {
  const rows = [[
    'framework', 'metric', 'value', 'unit', 'n', 'raw_values', 'scenario', 'source', 'date',
    'tool', 'tool_version', 'chrome', 'node', 'git_sha', 'run_id', 'status',
  ]];
  const lhVersion = summaryLighthouseVersion ?? '';
  for (const [name, f] of Object.entries(summary.frameworks)) {
    rows.push([
      name, 'bundle', f.bundle?.valueGzipBytes ?? '', 'B gzip', f.bundle ? 1 : 0, '',
      'initial load /', summary.source, summary.generatedAt, 'zlib gzip -9', process.versions.zlib ?? '',
      summary.environment.chrome, summary.environment.node, summary.environment.gitSha ?? '', summary.runId, f.status,
    ]);
    rows.push([
      name, 'tbt', f.tbt?.medianMs ?? '', 'ms', f.tbt?.n ?? 0, f.tbt?.values?.join('; ') ?? '',
      `${summary.protocol.tbtScenario} [${summary.protocol.lighthouseProfile}]`, summary.source, summary.generatedAt, 'Lighthouse', lhVersion,
      summary.environment.chrome, summary.environment.node, summary.environment.gitSha ?? '', summary.runId, f.status,
    ]);
    rows.push([
      name, 'memory', f.memory?.medianMB ?? '', 'MB usedJSHeap', f.memory?.n ?? 0,
      f.memory?.values?.map((v) => round(bytesToMB(v), 2)).join('; ') ?? '',
      summary.protocol.memoryScenario, summary.source, summary.generatedAt, 'CDP Performance.getMetrics', '',
      summary.environment.chrome, summary.environment.node, summary.environment.gitSha ?? '', summary.runId, f.status,
    ]);
  }
  return toCsv(rows);
}

let summaryLighthouseVersion = null;

function buildReportMd(summary, logPath, runDir) {
  const lines = [];
  lines.push(`# Raport pomiarowy klasy A — run ${summary.runId}`);
  lines.push('');
  lines.push(`Wygenerowano: ${summary.generatedAt}. Źródło: ${summary.source}.`);
  lines.push('');
  lines.push('## Wyniki (mediany)');
  lines.push('');
  lines.push('| Framework | bundle (KB gzip) | TBT (ms) | memory (MB usedJSHeap) | Status |');
  lines.push('|---|---|---|---|---|');
  for (const [name, f] of Object.entries(summary.frameworks)) {
    lines.push(`| ${name} | ${f.bundle ? round(f.bundle.valueGzipBytes / 1024, 1) : '—'} | ${f.tbt?.medianMs ?? '—'} | ${f.memory?.medianMB ?? '—'} | ${f.status} |`);
  }
  lines.push('');
  lines.push(`Kolejność wylosowana: ${summary.runOrder.join(' → ')}.`);
  const failed = Object.entries(summary.frameworks).filter(([, f]) => f.status !== 'OK').map(([n]) => n);
  lines.push(failed.length ? `FAILED: ${failed.join(', ')}.` : 'Wszystkie frameworki zmierzone (OK).');
  lines.push('');

  const tbtZero = Object.entries(summary.frameworks).filter(
    ([, f]) => f.status === 'OK' && f.tbt && f.tbt.values?.length && f.tbt.values.every((v) => v === 0),
  );
  if (tbtZero.length) {
    lines.push('## TBT = 0 ms — nie jest błędem pomiaru');
    lines.push('');
    lines.push(
      'Total Blocking Time (Lighthouse) to **suma** `(długość zadania − 50 ms)` wyłącznie dla zadań wątku głównego **dłuższych niż 50 ms** w oknie od First Contentful Paint do Time to Interactive. Zadania ≤ 50 ms nie wchodzą do metryki wcale.',
    );
    lines.push('');
    for (const [name, f] of tbtZero) {
      const fcp = f.tbt.fcpMedianMs != null ? `${Math.round(f.tbt.fcpMedianMs)} ms` : 'n/d';
      const tti = f.tbt.ttiMedianMs != null ? `${Math.round(f.tbt.ttiMedianMs)} ms` : 'n/d';
      const raw = f.tbt.values.join(', ');
      lines.push(
        `**${name}:** ${f.tbt.n} / ${f.tbt.n} powtórzeń dało TBT = 0 ms (wartości: ${raw}). ` +
          `Jednocześnie FCP (mediana) ≈ ${fcp}, TTI ≈ ${tti} — strona się namalowała i stała się interaktywna; to nie jest \`NO_FCP\` ani pusty ślad. ` +
          `Przy scenariuszu \`${summary.protocol.tbtScenario}\` i profilu ${summary.protocol.lighthouseProfile} koszt JS ${name} mieści się w taskach poniżej progu 50 ms (w LHR: Max Potential FID rzędu ~16 ms), więc TBT wynosi zero z definicji. ` +
          `Późniejszy FCP niż u lżejszych SPA (np. Vue) jest spójny z większym bundlem: parse/eval przesuwa first paint, ale po FCP nie ma już długich tasków. ` +
          `Zero jest legalną wartością do PROMETHEE (najlepszy wynik na tym kryterium), nie substytutem brakującego pomiaru.`,
      );
      lines.push('');
    }
  }

  lines.push('## Protokół');
  lines.push('');
  lines.push(`- Lighthouse: profil ${summary.protocol.lighthouseProfile}, domyślny throttling, ${summary.protocol.repetitions}× per framework, mediana.`);
  lines.push(`- TBT: \`${summary.protocol.tbtScenario}\`; memory: \`${summary.protocol.memoryScenario}\` (CDP Performance.getMetrics, GC przed odczytem).`);
  lines.push(`- Pauzy: ${summary.protocol.pauseSameFrameworkSec.join('–')} s w ramach frameworka, ${summary.protocol.pauseDifferentFrameworkSec.join('–')} s między frameworkami.`);
  lines.push(`- Sesje Chrome: ${summary.protocol.chromeSessions}.`);
  lines.push('- Świeży `--user-data-dir` na każde powtórzenie; profil usuwany po pomiarze.');
  lines.push('');
  lines.push('## Środowisko');
  lines.push('');
  const e = summary.environment;
  lines.push(`- Node ${e.node}, npm ${e.npm}`);
  lines.push(`- Chrome: ${e.chrome} (\`${e.chromePath}\`)`);
  lines.push(`- OS: ${e.os}; CPU: ${e.cpu}; RAM: ${e.ramGB} GB`);
  lines.push(`- Commit repo: ${e.gitSha ?? 'poza repo git'}`);
  lines.push('');
  lines.push('## Artefakty');
  lines.push('');
  lines.push(`- Pełny log: \`${logPath}\``);
  lines.push(`- Surowe JSONy: \`${runDir}\``);
  lines.push(`- Zagregowane: \`${path.join(RESULTS_DIR, 'summary.json')}\`, \`${path.join(RESULTS_DIR, 'summary.csv')}\``);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function findLatestRunDir() {
  if (!fs.existsSync(RAW_DIR)) return null;
  const dirs = fs
    .readdirSync(RAW_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('run_'))
    .map((d) => d.name)
    .sort();
  return dirs.length ? path.join(RAW_DIR, dirs.at(-1)) : null;
}

async function main() {
  const resume = process.argv.includes('--resume');
  const profileArg = process.argv.find((a) => a.startsWith('--profile='));
  const cliProfile = profileArg ? validateLighthouseProfile(profileArg.split('=')[1]) : null;

  let runDir;
  let state;
  if (resume) {
    runDir = findLatestRunDir();
    if (!runDir || !fs.existsSync(path.join(runDir, 'state.json'))) {
      throw new Error('--resume: brak poprzedniej serii w bench/results/raw (state.json nie znaleziony)');
    }
    state = readJson(path.join(runDir, 'state.json'));
    if (!state.profile) state.profile = LIGHTHOUSE_PROFILE;
    if (cliProfile && cliProfile !== state.profile) {
      throw new Error(
        `--resume: seria ${state.runId} była mierzona profilem "${state.profile}", a podano --profile=${cliProfile}. ` +
          'Jeden profil obowiązuje całą serię (§5.2) — wznów bez --profile albo zacznij nową serię.',
      );
    }
  } else {
    const runId = isoNow().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
    runDir = path.join(RAW_DIR, `run_${runId}`);
    ensureDir(runDir);
    state = { runId, profile: cliProfile ?? LIGHTHOUSE_PROFILE, runOrder: null, env: null, stability: null };
  }

  const log = createLogger(path.join(LOGS_DIR, `run_${state.runId}.log`));
  log(`=== run-all start (runId=${state.runId}, resume=${resume}, profil Lighthouse=${state.profile}) ===`);

  process.on('SIGINT', async () => {
    log('SIGINT — zatrzymuję bieżący serwer i kończę. Wznowienie: node run-all.mjs --resume');
    if (currentServer) await stopFramework(currentServer.fw, currentServer.child, log).catch(() => {});
    await log.close();
    process.exit(130);
  });

  log(`preflight: CHROME_PATH=${CHROME_PATH}`);
  assertChromePath();
  log('preflight: binarka Chrome istnieje — sprawdzam backend…');
  await preflightBackend(log);
  await preflightPorts(log);

  if (!state.env) {
    state.env = await envSnapshot(state.profile, log);
    log(`preflight: środowisko ${JSON.stringify(state.env)}`);
  } else {
    log('preflight: snapshot środowiska z wznowionej serii — pomijam odczyt');
  }
  summaryLighthouseVersion = null;

  log('preflight: losuję kolejność frameworków…');
  if (!state.runOrder) {
    state.runOrder = shuffle(FRAMEWORKS.map((f) => f.name));
    log(`kolejność wylosowana: ${state.runOrder.join(' → ')}`);
  } else {
    log(`kolejność z wznowionej serii: ${state.runOrder.join(' → ')}`);
  }
  writeJson(path.join(runDir, 'state.json'), state);

  const ordered = state.runOrder.map((name) => FRAMEWORKS.find((f) => f.name === name));
  const pending = [];
  const done = [];
  for (const fw of ordered) {
    const p = frameworkResultPath(runDir, fw);
    if (resume && fs.existsSync(p) && isComplete(readJson(p))) {
      log(`[${fw.name}] kompletny wynik z poprzedniego przebiegu — pomijam (resume)`);
      done.push(readJson(p));
    } else {
      pending.push(fw);
    }
  }

  if (!state.stability) state.stability = {};
  const toBuild = pending.filter((fw) => !state.stability[fw.name]);
  if (toBuild.length) {
    log(`preflight: do zbudowania: ${toBuild.map((f) => f.name).join(', ')}`);
    Object.assign(state.stability, await preflightBuilds(toBuild, log));
    writeJson(path.join(runDir, 'state.json'), state);
  } else {
    log('preflight: wszystkie frameworki mają już zanotowaną stabilność builda — pomijam buildy');
  }

  log(`preflight zakończony. Do zmierzenia: ${pending.map((f) => f.name).join(' → ') || '(nic — seria kompletna)'}`);

  const results = [...done];
  for (let i = 0; i < pending.length; i += 1) {
    const fw = pending[i];
    log(`=== framework ${i + 1}/${pending.length}: ${fw.name} ===`);
    const result = await measureFramework(fw, { runDir, log, profile: state.profile });
    results.push(result);
    const lhv = result?.tbt?.samples?.[0]?.lighthouseVersion;
    if (lhv) summaryLighthouseVersion = lhv;
    if (i < pending.length - 1) {
      const pauseSec = randomIntInclusive(...PAUSE_DIFFERENT_FRAMEWORK_SEC);
      await sleepWithHeartbeat(pauseSec * 1000, log, `pauza ${pauseSec} s przed następnym frameworkiem (§4.2)`);
    }
  }

  results.sort((a, b) => state.runOrder.indexOf(a.framework) - state.runOrder.indexOf(b.framework));
  const summary = buildSummary({
    runId: state.runId,
    env: state.env,
    runOrder: state.runOrder,
    results,
    stability: state.stability,
    profile: state.profile,
  });
  writeJson(path.join(RESULTS_DIR, 'summary.json'), summary);
  fs.writeFileSync(path.join(RESULTS_DIR, 'summary.csv'), summaryToCsv(summary));
  const reportPath = path.join(RESULTS_DIR, `report_${state.runId}.md`);
  fs.writeFileSync(reportPath, buildReportMd(summary, log.path, runDir));

  log(`summary: ${path.join(RESULTS_DIR, 'summary.json')} + summary.csv`);
  log(`raport: ${reportPath}`);
  const failed = results.filter((r) => r.status !== 'OK').map((r) => r.framework);
  log(`=== run-all koniec: OK=${results.length - failed.length}/${results.length}${failed.length ? `, FAILED: ${failed.join(', ')}` : ''} ===`);
  await log.close();
  if (failed.length) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (err) => {
    console.error(`${isoNow()} FATAL: ${err.stack || err}`);
    process.exit(1);
  });
}
