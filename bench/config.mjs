
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const BENCH_ROOT = here;
export const REPO_ROOT = path.resolve(here, '..');
export const RESULTS_DIR = path.join(here, 'results');
export const RAW_DIR = path.join(RESULTS_DIR, 'raw');
export const LOGS_DIR = path.join(here, 'logs');

function readLocalEnv() {
  const p = path.join(here, 'ENV.local.json');
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    throw new Error(`bench/ENV.local.json istnieje, ale nie parsuje się jako JSON: ${err.message}`);
  }
}

const local = readLocalEnv();


export const CHROME_PATH = process.env.CHROME_PATH || local.CHROME_PATH || '';


export const MEASUREMENT_NXDOMAIN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'code.ionicframework.com',
];

export function chromeHostResolverRules() {
  return `--host-resolver-rules=${MEASUREMENT_NXDOMAIN_HOSTS.map((h) => `MAP ${h} ~NOTFOUND`).join(', ')}`;
}

export const API_URL = process.env.API_URL || 'http://localhost:3000/api';


export const LIGHTHOUSE_PROFILES = ['mobile', 'desktop'];

export function validateLighthouseProfile(profile) {
  if (!LIGHTHOUSE_PROFILES.includes(profile)) {
    throw new Error(`Nieznany profil Lighthouse "${profile}". Dozwolone: ${LIGHTHOUSE_PROFILES.join(', ')}`);
  }
  return profile;
}

export const LIGHTHOUSE_PROFILE = validateLighthouseProfile(
  process.env.LIGHTHOUSE_PROFILE || local.LIGHTHOUSE_PROFILE || 'mobile',
);


export const REPETITIONS = 5;


export const PAUSE_SAME_FRAMEWORK_SEC = [30, 60];
export const PAUSE_DIFFERENT_FRAMEWORK_SEC = [120, 180];


export const SERVER_SETTLE_MS = 2500;


export const TBT_SCENARIO_PATH = '/?limit=20';

export const MEMORY_SCENARIO_PATH = '/?limit=1000';

export const LARGE_SCENARIO_PATH = MEMORY_SCENARIO_PATH;

export const LIGHTHOUSE_LARGE_MAX_WAIT_FOR_LOAD_MS = 90_000;

export const MIN_SEEDED_ARTICLES = 1000;


export const MEMORY_ARTICLE_SELECTOR = '.article-preview';
export const MEMORY_MIN_ARTICLES = 1000;
export const MEMORY_RENDER_TIMEOUT_MS = 180_000;

export const MEMORY_SETTLE_MS = 3000;

export const FRAMEWORKS = [
  {
    name: 'react',
    dir: 'frontends/react',
    port: 4173,
    buildCmd: 'npm run build',
    startCmd: 'npm run preview',
    distDir: 'dist',
  },
  {
    name: 'vue',
    dir: 'frontends/vue',
    port: 4174,
    buildCmd: 'npm run build',
    startCmd: 'npm run preview',
    distDir: 'dist',
  },
  {
    name: 'svelte',
    dir: 'frontends/svelte',
    port: 4175,
    buildCmd: 'npm run build',
    startCmd: 'npm run preview',
    distDir: 'dist',
  },
  {
    name: 'next',
    dir: 'frontends/next',
    port: 4300,
    buildCmd: 'npm run build',
    startCmd: 'npm run start -- -p 4300',
    distDir: '.next/static',
  },
  {
    name: 'nuxt',
    dir: 'frontends/nuxt',
    port: 4400,
    buildCmd: 'npm run build',
    startCmd: 'npm run preview',
    distDir: '.output/public',
  },
  {
    name: 'angular',
    dir: 'frontends/angular',
    port: 4500,
    buildCmd: 'npm run build',
    startCmd: 'npx --yes http-server dist/angular/browser -p 4500 -P "http://localhost:4500?"',
    distDir: 'dist/angular/browser',
  },
];

export function frameworkByName(name) {
  const fw = FRAMEWORKS.find((f) => f.name === name);
  if (!fw) {
    throw new Error(`Nieznany framework "${name}". Dostępne: ${FRAMEWORKS.map((f) => f.name).join(', ')}`);
  }
  return fw;
}

export function frameworkOrigin(fw) {
  return `http://localhost:${fw.port}`;
}
