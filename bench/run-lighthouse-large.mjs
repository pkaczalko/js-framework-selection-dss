
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  FRAMEWORKS,
  LARGE_SCENARIO_PATH,
  LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
  LIGHTHOUSE_PROFILE,
  LOGS_DIR,
  PAUSE_DIFFERENT_FRAMEWORK_SEC,
  PAUSE_SAME_FRAMEWORK_SEC,
  RAW_DIR,
  REPO_ROOT,
  REPETITIONS,
  TBT_SCENARIO_PATH,
  validateLighthouseProfile,
} from './config.mjs';
import { measureTbtSeries } from './lighthouse/measure.mjs';
import { assertChromePath } from './lib/chrome-session.mjs';
import { startFramework, stopFramework } from './lib/server-control.mjs';
import {
  createLogger,
  ensureDir,
  isoNow,
  randomIntInclusive,
  readJson,
  shuffle,
  sleepWithHeartbeat,
  writeJson,
} from './lib/stats.mjs';
import { envSnapshot, preflightBackend, preflightPorts } from './run-all.mjs';

let currentServer = null;

function frameworkResultPath(runDir, fw) {
  return path.join(runDir, `${fw.name}.json`);
}

function isComplete(result) {
  return result?.status === 'OK' && result?.tbt?.values?.length >= REPETITIONS;
}

function assertBuildExists(fw, log) {
  const buildRoot = path.join(REPO_ROOT, fw.dir, fw.distDir);
  if (!fs.existsSync(buildRoot)) {
    throw new Error(
      `[${fw.name}] brak katalogu builda: ${buildRoot}. ` +
        `Uruchom: cd ${fw.dir}; ${fw.buildCmd}`,
    );
  }
  log(`[${fw.name}] build OK: ${buildRoot}`);
}

function findLatestLargeRunDir() {
  if (!fs.existsSync(RAW_DIR)) return null;
  const dirs = fs
    .readdirSync(RAW_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('run_') && d.name.endsWith('_limit1000'))
    .map((d) => d.name)
    .sort();
  return dirs.length ? path.join(RAW_DIR, dirs.at(-1)) : null;
}

async function measureFrameworkLarge(fw, { runDir, log, profile }) {
  const result = {
    framework: fw.name,
    port: fw.port,
    startedAt: isoNow(),
    status: 'FAILED',
    scenarioPath: LARGE_SCENARIO_PATH,
  };
  let child = null;
  try {
    child = await startFramework(fw, log);
    currentServer = { fw, child };

    const tbt = await measureTbtSeries(fw, {
      rawDir: path.join(runDir, 'lighthouse'),
      log,
      profile,
      scenarioPath: LARGE_SCENARIO_PATH,
      maxWaitForLoad: LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
    });
    result.tbt = {
      unit: 'ms',
      profile,
      values: tbt.values,
      median: tbt.medianMs,
      samples: tbt.samples,
      scenarioPath: LARGE_SCENARIO_PATH,
      maxWaitForLoad: LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
    };
    result.status = 'OK';
  } catch (err) {
    result.error = { message: err.message, stack: err.stack };
    log.error(`[${fw.name}] pilot N=1000 nieudany`, err);
  } finally {
    if (child) {
      await stopFramework(fw, child, log).catch((e) => log.error(`[${fw.name}] problem przy stop`, e));
      currentServer = null;
    }
    result.finishedAt = isoNow();
    writeJson(frameworkResultPath(runDir, fw), result);
    log(`[${fw.name}] wynik częściowy: ${frameworkResultPath(runDir, fw)}`);
  }
  return result;
}

async function main() {
  const resume = process.argv.includes('--resume');
  const profileArg = process.argv.find((a) => a.startsWith('--profile='));
  const cliProfile = profileArg ? validateLighthouseProfile(profileArg.split('=')[1]) : null;

  let runDir;
  let state;
  if (resume) {
    runDir = findLatestLargeRunDir();
    if (!runDir || !fs.existsSync(path.join(runDir, 'state.json'))) {
      throw new Error('--resume: brak poprzedniej serii pilot N=1000 (state.json nie znaleziony)');
    }
    state = readJson(path.join(runDir, 'state.json'));
    if (!state.profile) state.profile = LIGHTHOUSE_PROFILE;
    if (cliProfile && cliProfile !== state.profile) {
      throw new Error(
        `--resume: seria ${state.runId} była mierzona profilem "${state.profile}", a podano --profile=${cliProfile}.`,
      );
    }
  } else {
    const ts = isoNow().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
    const runId = `${ts}_limit1000`;
    runDir = path.join(RAW_DIR, `run_${runId}`);
    ensureDir(runDir);
    state = {
      runId,
      kind: 'lighthouse-large',
      profile: cliProfile ?? LIGHTHOUSE_PROFILE,
      scenarioPath: LARGE_SCENARIO_PATH,
      maxWaitForLoad: LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS,
      runOrder: null,
      env: null,
    };
  }

  const log = createLogger(path.join(LOGS_DIR, `run_${state.runId}.log`));
  log(`=== run-lighthouse-large start (runId=${state.runId}, resume=${resume}, profil=${state.profile}) ===`);

  process.on('SIGINT', async () => {
    log('SIGINT — zatrzymuję bieżący serwer. Wznowienie: node run-lighthouse-large.mjs --resume');
    if (currentServer) await stopFramework(currentServer.fw, currentServer.child, log).catch(() => {});
    await log.close();
    process.exit(130);
  });

  log(`preflight: scenariusz=${LARGE_SCENARIO_PATH}, maxWaitForLoad=${LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS} ms`);
  log(`preflight: baseline N=20 pozostaje na ${TBT_SCENARIO_PATH} (read-only)`);
  assertChromePath();
  await preflightBackend(log);
  await preflightPorts(log);

  if (!state.env) {
    state.env = await envSnapshot(state.profile, log);
    state.env.pilotScenario = LARGE_SCENARIO_PATH;
    state.env.pilotMaxWaitForLoad = LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS;
    log(`preflight: środowisko ${JSON.stringify(state.env)}`);
  }

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
      log(`[${fw.name}] kompletny wynik — pomijam (resume)`);
      done.push(readJson(p));
    } else {
      pending.push(fw);
    }
  }

  for (const fw of pending) {
    assertBuildExists(fw, log);
  }

  log(`preflight zakończony. Do zmierzenia: ${pending.map((f) => f.name).join(' → ') || '(nic — seria kompletna)'}`);

  const results = [...done];
  for (let i = 0; i < pending.length; i += 1) {
    const fw = pending[i];
    log(`=== framework ${i + 1}/${pending.length}: ${fw.name} (N=1000) ===`);
    results.push(await measureFrameworkLarge(fw, { runDir, log, profile: state.profile }));
    if (i < pending.length - 1) {
      const pauseSec = randomIntInclusive(...PAUSE_DIFFERENT_FRAMEWORK_SEC);
      await sleepWithHeartbeat(pauseSec * 1000, log, `pauza ${pauseSec} s przed następnym frameworkiem (§4.2)`);
    }
  }

  results.sort((a, b) => state.runOrder.indexOf(a.framework) - state.runOrder.indexOf(b.framework));
  const failed = results.filter((r) => r.status !== 'OK').map((r) => r.framework);
  log(`=== run-lighthouse-large koniec: OK=${results.length - failed.length}/${results.length}${failed.length ? `, FAILED: ${failed.join(', ')}` : ''} ===`);
  log(`Surowe LHR: ${path.join(runDir, 'lighthouse')}`);
  log(`Ekstrakcja: node bench/results/extract-limit1000.mjs --run=${path.basename(runDir)}`);
  await log.close();
  if (failed.length) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (err) => {
    console.error(`${isoNow()} FATAL: ${err.stack || err}`);
    process.exit(1);
  });
}
