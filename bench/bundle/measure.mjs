
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, frameworkByName, frameworkOrigin } from '../config.mjs';
import { startFramework, stopFramework, isPortFree, assertProductionBuild } from '../lib/server-control.mjs';

function gzipSize(buf) {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function extractInitialAssetUrls(html, origin) {
  const urls = new Set();
  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/gi,
    /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi,
    /<link[^>]+rel=["']modulepreload["'][^>]*href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']modulepreload["']/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const raw = m[1];

      const url = new URL(raw, `${origin}/`);
      if (url.origin !== origin) continue;
      if (!/\.(m?js|css)(\?|$)/i.test(url.pathname)) continue;
      urls.add(url.href);
    }
  }
  return [...urls];
}

export async function measureServedBundle(fw, log) {
  const origin = frameworkOrigin(fw);
  const html = await assertProductionBuild(origin);
  const assetUrls = extractInitialAssetUrls(html, origin);
  if (!assetUrls.length) {
    throw new Error(`[${fw.name}] HTML z ${origin}/ nie zawiera żadnych zasobów JS/CSS — podejrzany build`);
  }
  const assets = [];
  for (const url of assetUrls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[${fw.name}] GET ${url} → HTTP ${res.status}`);
    const body = Buffer.from(await res.arrayBuffer());
    assets.push({
      url: url.replace(origin, ''),
      rawBytes: body.length,
      gzipBytes: gzipSize(body),
    });
  }
  assets.sort((a, b) => b.gzipBytes - a.gzipBytes);
  const totalGzipBytes = assets.reduce((s, a) => s + a.gzipBytes, 0);
  const totalRawBytes = assets.reduce((s, a) => s + a.rawBytes, 0);
  log(`[${fw.name}] bundle initial: ${assets.length} zasobów, gzip=${totalGzipBytes} B (raw=${totalRawBytes} B)`);
  for (const a of assets) log(`[${fw.name}][bundle] ${a.gzipBytes} B gzip  ${a.url}`);
  return { totalGzipBytes, totalRawBytes, assets };
}

export function bundleStabilitySample(result) {
  return {
    gzipBytes: result.totalGzipBytes,
    files: result.assets.length,
    urls: result.assets.map((a) => a.url),
  };
}

export function distGzipTotal(fw) {
  const root = path.join(REPO_ROOT, fw.dir, fw.distDir);
  if (!fs.existsSync(root)) {
    throw new Error(`[${fw.name}] brak katalogu builda: ${root} — uruchom "${fw.buildCmd}"`);
  }
  let total = 0;
  let files = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(m?js|css)$/i.test(entry.name)) {
        total += gzipSize(fs.readFileSync(p));
        files += 1;
      }
    }
  };
  walk(root);
  return { gzipBytes: total, files };
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--framework='));
  if (!arg) {
    console.error('Użycie: node bench/bundle/measure.mjs --framework=<react|vue|svelte|next|nuxt|angular>');
    process.exit(2);
  }
  const fw = frameworkByName(arg.split('=')[1]);
  const log = (m) => console.log(m);

  const reuse = !(await isPortFree(fw.port));
  const child = reuse ? null : await startFramework(fw, log);
  try {
    const result = await measureServedBundle(fw, log);
    console.log(JSON.stringify(result, null, 2));
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
