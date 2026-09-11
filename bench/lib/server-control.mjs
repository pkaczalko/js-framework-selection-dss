import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { REPO_ROOT, SERVER_SETTLE_MS, MEMORY_SCENARIO_PATH, frameworkOrigin } from '../config.mjs';
import { sleep } from './stats.mjs';

export function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (free) => {
      socket.destroy();
      resolve(free);
    };
    socket.once('connect', () => done(false));
    socket.once('error', () => done(true));
    socket.setTimeout(1500, () => done(true));
  });
}

export async function waitUntilPortFree(port, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortFree(port)) return;
    await sleep(250);
  }
  throw new Error(`Port ${port} nadal zajęty po ${timeoutMs} ms od zatrzymania serwera`);
}

export async function waitUntilHttpReady(url, timeoutMs = 180_000, log) {
  const start = Date.now();
  let lastErr;
  let lastBeat = start;
  if (log) log(`czekam na HTTP ${url} (timeout ${Math.round(timeoutMs / 1000)} s)…`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0 && res.status < 500) {
        if (log) log(`HTTP ${url} → ${res.status} po ${Date.now() - start} ms`);
        return;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (log && Date.now() - lastBeat >= 10_000) {
      log(`nadal czekam na ${url} (${Math.round((Date.now() - start) / 1000)} s) — ${lastErr?.message || lastErr}`);
      lastBeat = Date.now();
    }
    await sleep(400);
  }
  throw new Error(`Serwer nie odpowiedział na ${url} w ${timeoutMs} ms: ${lastErr?.message || lastErr}`);
}

export async function portOwnerPids(port) {
  if (process.platform !== 'win32') return [];
  const out = await execCapture(`netstat -ano | findstr LISTENING | findstr :${port}`).catch(() => '');
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const m = line.trim().match(/^TCP\s+\S*:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/i);
    if (m && Number(m[1]) === port) pids.add(Number(m[2]));
  }
  return [...pids];
}

export async function killPids(pids) {
  for (const pid of pids) {
    await execCapture(`taskkill /PID ${pid} /T /F`).catch(() => {});
  }
}

function execCapture(command, cwd = REPO_ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, windowsHide: true });
    let out = '';
    child.stdout.on('data', (b) => {
      out += String(b);
    });
    child.stderr.on('data', (b) => {
      out += String(b);
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`"${command}" exit ${code}\n${out}`))));
  });
}

function attachLineLogger(stream, onLine) {
  let buf = '';
  stream.on('data', (chunk) => {
    buf += String(chunk);
    const parts = buf.split(/\r?\n/);
    buf = parts.pop() ?? '';
    for (const line of parts) {
      if (line.trim()) onLine(line);
    }
  });
  stream.on('end', () => {
    if (buf.trim()) onLine(buf);
  });
}

export function runLoggedCommand(command, cwd, log, label, { heartbeatMs = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    log(`${label}: ${command} (cwd=${cwd})`);
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    let lastOutput = Date.now();
    const onLine = (line) => {
      lastOutput = Date.now();
      log(`${label} ${line}`);
    };
    attachLineLogger(child.stdout, onLine);
    attachLineLogger(child.stderr, onLine);
    const beat = setInterval(() => {
      const silent = Math.round((Date.now() - lastOutput) / 1000);
      const elapsed = Math.round((Date.now() - started) / 1000);
      log(`${label} … nadal działa (${elapsed} s, cisza ${silent} s)`);
    }, heartbeatMs);
    child.on('error', (err) => {
      clearInterval(beat);
      reject(err);
    });
    child.on('exit', (code) => {
      clearInterval(beat);
      const ms = Date.now() - started;
      if (code === 0) {
        log(`${label} OK w ${ms} ms`);
        resolve();
      } else {
        reject(new Error(`${label} exit ${code} po ${ms} ms: ${command}`));
      }
    });
  });
}

export async function runBuild(fw, log) {
  const cwd = path.join(REPO_ROOT, fw.dir);
  await runLoggedCommand(fw.buildCmd, cwd, log, `[${fw.name}][build]`);
}

export async function assertProductionBuild(origin) {
  const res = await fetch(`${origin}/`);
  if (!res.ok) throw new Error(`GET ${origin}/ → HTTP ${res.status}`);
  const html = await res.text();
  const hay = html.toLowerCase();
  const markers = ['/@vite/client', 'webpack-dev-server', '__vite_ping', '__webpack_hmr', 'vite/dist/client'];
  const hit = markers.find((m) => hay.includes(m));
  if (hit) {
    throw new Error(`Marker dev-serwera "${hit}" w odpowiedzi ${origin}/ — pomiar wyłącznie na buildzie prod`);
  }
  return html;
}

export async function startFramework(fw, log) {
  const cwd = path.join(REPO_ROOT, fw.dir);
  if (!(await isPortFree(fw.port))) {
    throw new Error(`Port ${fw.port} zajęty przed startem ${fw.name}`);
  }
  log(`[${fw.name}] start: ${fw.startCmd} (cwd=${cwd})`);
  const child = spawn(fw.startCmd, {
    cwd,
    shell: true,
    windowsHide: true,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (b) => log(`[${fw.name}][srv] ${String(b).trimEnd()}`));
  child.stderr.on('data', (b) => log(`[${fw.name}][srv:err] ${String(b).trimEnd()}`));
  child.on('exit', (code, signal) => log(`[${fw.name}][srv] exit code=${code} signal=${signal}`));

  const origin = frameworkOrigin(fw);
  try {
    await waitUntilHttpReady(`${origin}/`, 180_000, log);
    await assertProductionBuild(origin);

    await sleep(SERVER_SETTLE_MS);
    log(`[${fw.name}] serwer prod gotowy: ${origin} (settle ${SERVER_SETTLE_MS} ms)`);
    await warmupMemoryScenario(fw, log);
  } catch (err) {
    await stopProcessTree(child);
    await waitUntilPortFree(fw.port).catch(() => {});
    throw err;
  }
  return child;
}

export async function warmupMemoryScenario(fw, log) {
  const url = `${frameworkOrigin(fw)}${MEMORY_SCENARIO_PATH}`;
  log(`[${fw.name}] warmup (nieliczony) GET ${url}`);
  const res = await fetch(url, { redirect: 'manual' });
  await res.arrayBuffer().catch(() => {});
  log(`[${fw.name}] warmup → HTTP ${res.status}`);
  if (!res.ok) {
    throw new Error(`[${fw.name}] warmup GET ${url} → HTTP ${res.status}`);
  }
}

export async function stopFramework(fw, child, log) {
  log(`[${fw.name}] stop pid=${child.pid} — czekam aż port ${fw.port} będzie wolny`);
  await stopProcessTree(child);
  await waitUntilPortFree(fw.port);
  log(`[${fw.name}] port ${fw.port} zwolniony`);
}

async function stopProcessTree(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') {

    await execCapture(`taskkill /PID ${child.pid} /T /F`).catch(() => {});
  } else {
    child.kill('SIGTERM');
    await sleep(500);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
  await sleep(300);
}
