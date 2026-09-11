
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import {
  LIGHTHOUSE_PROFILE,
  LARGE_SCENARIO_PATH,
  LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
  REPETITIONS,
  PAUSE_SAME_FRAMEWORK_SEC,
  TBT_SCENARIO_PATH,
  frameworkByName,
  frameworkOrigin,
  validateLighthouseProfile,
  RAW_DIR,
} from '../config.mjs';
import { withChromeSession } from '../lib/chrome-session.mjs';
import { median, randomIntInclusive, sleep, sleepWithHeartbeat, ensureDir } from '../lib/stats.mjs';
import { startFramework, stopFramework, isPortFree } from '../lib/server-control.mjs';

const TRANSIENT_LH = /NO_FCP|PROTOCOL_TIMEOUT|PAGE_HUNG|CHROME_INTERSTITIAL|NO_NAVSTART/;
const LH_ATTEMPTS = 3;

export function buildLighthouseConfig(profile, { maxWaitForLoad } = {}) {
  validateLighthouseProfile(profile);
  if (maxWaitForLoad == null) {
    return profile === 'desktop' ? desktopConfig : undefined;
  }
  if (profile === 'desktop') {
    return {
      ...desktopConfig,
      settings: { ...desktopConfig.settings, maxWaitForLoad },
    };
  }
  return {
    extends: 'lighthouse:default',
    settings: { maxWaitForLoad },
  };
}

function resolveScenarioFromCli() {
  const scenarioArg = process.argv.find((a) => a.startsWith('--scenario='));
  if (!scenarioArg) {
    return { scenarioPath: TBT_SCENARIO_PATH, maxWaitForLoad: undefined };
  }
  const value = scenarioArg.split('=')[1];
  if (value === 'large') {
    return {
      scenarioPath: LARGE_SCENARIO_PATH,
      maxWaitForLoad: LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
    };
  }
  if (value.startsWith('/')) {
    return { scenarioPath: value, maxWaitForLoad: undefined };
  }
  throw new Error(`Nieznany scenariusz "${value}". Dozwolone: --scenario=large lub --scenario=/?limit=1000`);
}

export async function measureTbtOnce(
  fw,
  {
    rawDir,
    repetition,
    log,
    profile = LIGHTHOUSE_PROFILE,
    scenarioPath = TBT_SCENARIO_PATH,
    maxWaitForLoad,
  } = {},
) {
  validateLighthouseProfile(profile);
  const url = `${frameworkOrigin(fw)}${scenarioPath}`;
  const lhConfig = buildLighthouseConfig(profile, { maxWaitForLoad });
  log(`[${fw.name}] tbt rep ${repetition} (${profile}): startuję Chrome + Lighthouse → ${url}`);
  return withChromeSession(async (chrome) => {
    log(`[${fw.name}] tbt rep ${repetition}: Chrome na porcie ${chrome.port}, Lighthouse pracuje…`);
    const started = Date.now();
    const beat = setInterval(() => {
      log(`[${fw.name}] tbt rep ${repetition}: Lighthouse nadal pracuje (${Math.round((Date.now() - started) / 1000)} s)…`);
    }, 15_000);
    let result;
    try {
      result = await lighthouse(
        url,
        {
          port: chrome.port,
          hostname: '127.0.0.1',
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance'],
        },
        lhConfig,
      );
    } finally {
      clearInterval(beat);
    }
    const { lhr } = result;
    if (lhr.runtimeError) {
      if (rawDir) {
        ensureDir(rawDir);
        const p = path.join(rawDir, `lighthouse_${fw.name}_rep${repetition}_error.json`);
        fs.writeFileSync(p, result.report);
        log(`[${fw.name}] tbt rep ${repetition}: zapisano LHR błędu ${p}`);
      }
      throw new Error(`[${fw.name}] Lighthouse runtimeError: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
    }
    const audit = (id) => lhr.audits[id]?.numericValue ?? null;
    const sample = {
      tbtMs: audit('total-blocking-time'),
      fcpMs: audit('first-contentful-paint'),
      lcpMs: audit('largest-contentful-paint'),
      ttiMs: audit('interactive'),
      speedIndexMs: audit('speed-index'),
      lighthouseVersion: lhr.lighthouseVersion,
      fetchTime: lhr.fetchTime,
      profile,
      formFactor: lhr.configSettings?.formFactor ?? null,
      url,
      scenarioPath,
    };
    if (sample.tbtMs === null) {
      throw new Error(`[${fw.name}] Lighthouse nie zwrócił total-blocking-time`);
    }
    if (sample.formFactor && sample.formFactor !== profile) {
      throw new Error(`[${fw.name}] Lighthouse zmierzył formFactor=${sample.formFactor}, oczekiwano ${profile}`);
    }
    if (rawDir) {

      ensureDir(rawDir);
      const p = path.join(rawDir, `lighthouse_${fw.name}_rep${repetition}.json`);
      fs.writeFileSync(p, result.report);
      sample.reportPath = p;
    }
    log(`[${fw.name}] tbt rep ${repetition} (${profile}): TBT=${sample.tbtMs.toFixed(1)} ms (FCP=${sample.fcpMs?.toFixed(0)} LCP=${sample.lcpMs?.toFixed(0)} TTI=${sample.ttiMs?.toFixed(0)})`);
    return sample;
  });
}

async function measureTbtOnceRetried(fw, opts) {
  let lastErr;
  for (let attempt = 1; attempt <= LH_ATTEMPTS; attempt += 1) {
    try {
      return await measureTbtOnce(fw, opts);
    } catch (err) {
      lastErr = err;
      const msg = err?.message || String(err);
      const retry = TRANSIENT_LH.test(msg) && attempt < LH_ATTEMPTS;
      opts.log(
        `[${fw.name}] tbt rep ${opts.repetition}: próba ${attempt}/${LH_ATTEMPTS} nieudana (${msg})${retry ? ' — ponawiam ze świeżym Chrome' : ''}`,
      );
      if (!retry) throw err;
      await sleep(3000);
    }
  }
  throw lastErr;
}

export async function measureTbtSeries(
  fw,
  {
    rawDir,
    log,
    repetitions = REPETITIONS,
    profile = LIGHTHOUSE_PROFILE,
    scenarioPath = TBT_SCENARIO_PATH,
    maxWaitForLoad,
  } = {},
) {
  const samples = [];
  for (let rep = 1; rep <= repetitions; rep += 1) {
    samples.push(
      await measureTbtOnceRetried(fw, {
        rawDir,
        repetition: rep,
        log,
        profile,
        scenarioPath,
        maxWaitForLoad,
      }),
    );
    if (rep < repetitions) {
      const pauseSec = randomIntInclusive(...PAUSE_SAME_FRAMEWORK_SEC);
      await sleepWithHeartbeat(pauseSec * 1000, log, `[${fw.name}] pauza ${pauseSec} s między powtórzeniami tbt (§4.2)`);
    }
  }
  const values = samples.map((s) => s.tbtMs);
  return { values, medianMs: median(values), samples, profile, scenarioPath };
}

async function main() {
  const fwArg = process.argv.find((a) => a.startsWith('--framework='));
  if (!fwArg) {
    console.error(
      'Użycie: node bench/lighthouse/measure.mjs --framework=<nazwa> [--reps=N] [--profile=mobile|desktop] [--scenario=large|/?limit=1000]',
    );
    process.exit(2);
  }
  const repsArg = process.argv.find((a) => a.startsWith('--reps='));
  const repetitions = repsArg ? Number(repsArg.split('=')[1]) : REPETITIONS;
  const profileArg = process.argv.find((a) => a.startsWith('--profile='));
  const profile = validateLighthouseProfile(profileArg ? profileArg.split('=')[1] : LIGHTHOUSE_PROFILE);
  const { scenarioPath, maxWaitForLoad } = resolveScenarioFromCli();
  const fw = frameworkByName(fwArg.split('=')[1]);
  const log = (m) => console.log(`${new Date().toISOString()} ${m}`);
  const rawDir = path.join(RAW_DIR, 'debug');

  const reuse = !(await isPortFree(fw.port));
  const child = reuse ? null : await startFramework(fw, log);
  try {
    const out = await measureTbtSeries(fw, {
      rawDir,
      log,
      repetitions,
      profile,
      scenarioPath,
      maxWaitForLoad,
    });
    console.log(JSON.stringify({ framework: fw.name, ...out, samples: undefined }, null, 2));
    console.log(`mediana TBT: ${out.medianMs} ms z ${out.values.length} powtórzeń (scenariusz ${scenarioPath})`);
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
