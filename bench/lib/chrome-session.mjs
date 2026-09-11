import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { launch } from 'chrome-launcher';
import { CHROME_PATH, chromeHostResolverRules } from '../config.mjs';

const BASE_FLAGS = [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-component-update',
  '--disable-background-networking',
  '--disable-sync',
  '--metrics-recording-only',
  '--mute-audio',

  chromeHostResolverRules(),
];

export function assertChromePath() {
  if (!CHROME_PATH || !fs.existsSync(CHROME_PATH)) {
    throw new Error(
      `CHROME_PATH nie wskazuje na plik wykonywalny Chrome: "${CHROME_PATH || '(puste)'}". ` +
        'Ustaw zmienną środowiskową CHROME_PATH albo pole CHROME_PATH w bench/ENV.local.json.',
    );
  }
}

function parseChromeVersionString(raw) {
  const m = String(raw || '').match(/(\d+\.\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

export function readChromePeVersion(chromePath) {
  if (process.platform !== 'win32') return Promise.resolve(null);
  return new Promise((resolve) => {
    const ps = `try { (Get-Item -LiteralPath ${JSON.stringify(chromePath)}).VersionInfo.ProductVersion } catch { '' }`;
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', ps], { windowsHide: true });
    let out = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 10_000);
    child.stdout.on('data', (b) => {
      out += String(b);
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on('exit', () => {
      clearTimeout(timer);
      resolve(parseChromeVersionString(out.trim().split(/\r?\n/).pop()));
    });
  });
}

export async function readChromeProductVersion(log) {
  assertChromePath();
  try {
    const viaCdp = await withChromeSession(async (chrome) => {
      const res = await fetch(`http://127.0.0.1:${chrome.port}/json/version`);
      if (!res.ok) throw new Error(`GET /json/version → HTTP ${res.status}`);
      const body = await res.json();
      log(`preflight: Chrome CDP /json/version Browser="${body.Browser}" UA="${body['User-Agent']}"`);
      const ver = parseChromeVersionString(body.Browser);
      if (!ver) throw new Error(`odpowiedź bez numeru wersji: ${JSON.stringify(body)}`);
      return ver;
    });
    return viaCdp;
  } catch (err) {
    log(`preflight: CDP wersji Chrome nieudane (${err.message}) — próbuję PE ProductVersion`);
    const pe = await readChromePeVersion(CHROME_PATH);
    if (!pe) {
      throw new Error(
        `Nie udało się odczytać wersji Chrome (wymagane w metadanych protokołu). ` +
          `CDP: ${err.message}. PE: brak ProductVersion w "${CHROME_PATH}".`,
      );
    }
    log(`preflight: Chrome PE ProductVersion=${pe}`);
    return pe;
  }
}

export async function withChromeSession(fn) {
  assertChromePath();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thesis-dss-chrome-'));
  const chrome = await launch({
    chromePath: CHROME_PATH,
    userDataDir,
    chromeFlags: BASE_FLAGS,
  });
  try {
    return await fn(chrome);
  } finally {
    try {
      await chrome.kill();
    } catch {

    }
    await removeUserDataDir(userDataDir);
  }
}

async function removeUserDataDir(userDataDir) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  console.warn(`UWAGA: nie udało się usunąć profilu tymczasowego ${userDataDir} — usuń ręcznie po serii`);
}

export function browserURL(chrome) {
  return `http://127.0.0.1:${chrome.port}`;
}
