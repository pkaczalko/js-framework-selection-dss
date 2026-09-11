import { getDecisionMatrix, getManualProfiles, ALTERNATIVES, DataVolume } from './engine/dss_model14';
import { computePromethee, critic, merec, PrometheeResult } from './engine/promethee';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.join(
  process.env.FIGURES_DIR ?? path.resolve('figures'),
  'r6 - heatmapa-pozycji.png'
);

interface ConfigRow {
  volume: DataVolume;
  name: string;
  type: 'manual' | 'objective';
  typeLabel: string;
  results: Record<string, { phi: number; rank: number }>;
  leader: string;
  leaderPhi: number;
  runnerUp: string;
  margin: number;
}

function computeAllRows(): ConfigRow[] {
  const configs: { name: string; type: 'manual' | 'objective'; typeLabel: string }[] = [
    { name: 'Podstawowy', type: 'manual', typeLabel: 'Profil decydenta (Reguła C)' },
    { name: 'Enterprise', type: 'manual', typeLabel: 'Profil decydenta (Reguła C)' },
    { name: 'Wydajność', type: 'manual', typeLabel: 'Profil decydenta (Reguła C)' },
    { name: 'SEO', type: 'manual', typeLabel: 'Profil decydenta (Reguła C)' },
    { name: 'CRITIC', type: 'objective', typeLabel: 'Wagi obiektywne (korelacja/odchylenie)' },
    { name: 'MEREC', type: 'objective', typeLabel: 'Wagi obiektywne (efekt usunięcia)' },
  ];

  const rows: ConfigRow[] = [];
  const manual = getManualProfiles();

  for (const vol of ['N20', 'N1000'] as DataVolume[]) {
    const mat = getDecisionMatrix(vol);

    for (const cfg of configs) {
      let weights: number[];
      if (cfg.name === 'CRITIC') {
        weights = critic(mat);
      } else if (cfg.name === 'MEREC') {
        weights = merec(mat);
      } else {
        weights = manual[cfg.name];
      }

      const res = computePromethee(mat, weights);
      const cellMap: Record<string, { phi: number; rank: number }> = {};

      res.scores.forEach((s) => {
        cellMap[s.alternative] = { phi: s.phiNet, rank: s.rank };
      });

      const sortedByRank = [...res.scores].sort((a, b) => a.rank - b.rank);
      const leader = sortedByRank[0];
      const runnerUp = sortedByRank[1];
      const margin = leader.phiNet - runnerUp.phiNet;

      rows.push({
        volume: vol,
        name: cfg.name,
        type: cfg.type,
        typeLabel: cfg.typeLabel,
        results: cellMap,
        leader: leader.alternative,
        leaderPhi: leader.phiNet,
        runnerUp: runnerUp.alternative,
        margin,
      });
    }
  }

  return rows;
}

function formatPhi(val: number): string {
  const sign = val > 0 ? '+' : val < 0 ? '' : ' ';
  return `${sign}${val.toFixed(4).replace('.', ',')}`;
}

function generateHtml(rows: ConfigRow[]): string {
  const alts = ['React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js'];

  const n20Rows = rows.filter((r) => r.volume === 'N20');
  const n1000Rows = rows.filter((r) => r.volume === 'N1000');

  const renderSection = (title: string, sub: string, sectionRows: ConfigRow[], badgeClass: string) => `
    <div class="scenario-block">
      <div class="scenario-header">
        <span class="scenario-badge ${badgeClass}">${title}</span>
        <span class="scenario-sub">${sub}</span>
      </div>
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-config">Konfiguracja decyzyjna</th>
            ${alts.map((a) => `<th class="col-alt">${a}</th>`).join('')}
            <th class="col-leader">Lider i marża Δφ</th>
          </tr>
        </thead>
        <tbody>
          ${sectionRows
            .map((r) => {
              return `
              <tr>
                <td class="cell-config">
                  <div class="config-name">${r.name}</div>
                  <div class="config-type">${r.typeLabel}</div>
                </td>
                ${alts
                  .map((a) => {
                    const item = r.results[a];
                    const rank = item.rank;
                    const phiStr = formatPhi(item.phi);
                    const isPositive = item.phi > 0;
                    return `
                      <td class="cell-data rank-${rank}">
                        <div class="rank-badge rank-badge-${rank}">#${rank}</div>
                        <div class="phi-val ${isPositive ? 'phi-pos' : 'phi-neg'}">${phiStr}</div>
                      </td>
                    `;
                  })
                  .join('')}
                <td class="cell-leader">
                  <div class="leader-name"><strong>${r.leader}</strong></div>
                  <div class="leader-margin">marża: <strong>+${r.margin.toFixed(4).replace('.', ',')}</strong></div>
                  <div class="runner-sub">nad ${r.runnerUp}</div>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Macierz pozycji rankingowych PROMETHEE II</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 32px 36px;
      width: 1440px;
    }
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13.5px;
      color: #64748b;
      line-height: 1.4;
    }
    .scenario-block {
      margin-bottom: 28px;
    }
    .scenario-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .scenario-badge {
      font-size: 13px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-n20 {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-n1000 {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .scenario-sub {
      font-size: 13px;
      color: #475569;
      font-weight: 500;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .matrix-table th {
      background: #f8fafc;
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .matrix-table th.col-config {
      text-align: left;
      width: 230px;
    }
    .matrix-table th.col-alt {
      width: 155px;
    }
    .matrix-table th.col-leader {
      width: 180px;
      text-align: left;
    }
    .matrix-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      vertical-align: middle;
    }
    .cell-config {
      background: #fbfcfe;
    }
    .config-name {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
    .config-type {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .cell-data {
      text-align: center;
      transition: background 0.15s;
    }
    .cell-data.rank-1 {
      background: #ecfdf5;
    }
    .cell-data.rank-2 {
      background: #f0fdf4;
    }
    .cell-data.rank-3 {
      background: #f8fafc;
    }
    .cell-data.rank-4 {
      background: #fffbeb;
    }
    .cell-data.rank-5 {
      background: #fff1f2;
    }
    .cell-data.rank-6 {
      background: #fef2f2;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 22px;
      border-radius: 11px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .rank-badge-1 {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 1px 2px rgba(5,150,105,0.25);
    }
    .rank-badge-2 {
      background: #10b981;
      color: #ffffff;
    }
    .rank-badge-3 {
      background: #64748b;
      color: #ffffff;
    }
    .rank-badge-4 {
      background: #f59e0b;
      color: #ffffff;
    }
    .rank-badge-5 {
      background: #f87171;
      color: #ffffff;
    }
    .rank-badge-6 {
      background: #dc2626;
      color: #ffffff;
    }
    .phi-val {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      letter-spacing: -0.02em;
    }
    .phi-pos {
      color: #047857;
      font-weight: 600;
    }
    .phi-neg {
      color: #b91c1c;
      font-weight: 500;
    }
    .cell-leader {
      background: #fbfcfe;
      font-size: 12.5px;
    }
    .leader-name {
      color: #0f172a;
      font-size: 13.5px;
    }
    .leader-margin {
      color: #059669;
      font-size: 11.5px;
      margin-top: 1px;
    }
    .runner-sub {
      color: #64748b;
      font-size: 10.5px;
    }
    .legend {
      margin-top: 20px;
      padding: 14px 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #475569;
    }
    .legend-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .legend-ranks {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-note {
      font-size: 11.5px;
      color: #64748b;
      max-width: 440px;
      line-height: 1.4;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Macierz pozycji rankingowych i przepływów netto &phi; PROMETHEE II</div>
    <div class="subtitle">Syntetyczne zestawienie rang (1–6) oraz wartości przepływów bilansowych sześciu alternatyw JavaScript w dwunastu konfiguracjach decyzyjnych (2 wolumeny danych &times; 6 zestawów wag).</div>
  </div>

  ${renderSection('Scenariusz bazowy N20', 'Obciążenie umiarkowane (20 artykułów na liście)', n20Rows, 'badge-n20')}
  ${renderSection('Scenariusz skalowalny N1000', 'Wysokie obciążenie wolumenowe (1000 artykułów na liście)', n1000Rows, 'badge-n1000')}

  <div class="legend">
    <div>
      <div class="legend-title">Oznaczenia rang i interpretacja barw komórek:</div>
      <div class="legend-ranks">
        <div class="legend-item"><span class="rank-badge rank-badge-1">#1</span> <span>1. miejsce (Lider)</span></div>
        <div class="legend-item"><span class="rank-badge rank-badge-2">#2</span> <span>2. miejsce</span></div>
        <div class="legend-item"><span class="rank-badge rank-badge-3">#3</span> <span>3. miejsce</span></div>
        <div class="legend-item"><span class="rank-badge rank-badge-4">#4</span> <span>4. miejsce</span></div>
        <div class="legend-item"><span class="rank-badge rank-badge-5">#5</span> <span>5. miejsce</span></div>
        <div class="legend-item"><span class="rank-badge rank-badge-6">#6</span> <span>6. miejsce (Ostatnie)</span></div>
      </div>
    </div>
    <div class="legend-note">
      Wartości w komórkach oznaczają przepływ netto &phi; = &phi;⁺ &minus; &phi;⁻ &isin; [&minus;1, 1]. Dodatni bilans netto wskazuje przewagę nad resztą stawki, a ujemny deficyt. Wagi profili manualnych wyznaczono procedurą Reguły C, natomiast metody CRITIC i MEREC generują wagi obiektywne z macierzy decyzyjnej.
    </div>
  </div>
</body>
</html>
  `;
}

async function run() {
  const rows = computeAllRows();
  console.log(`Wyliczono ${rows.length} wierszy konfiguracji.`);

  for (const r of rows) {
    console.log(`[${r.volume}] ${r.name}: Lider = ${r.leader} (${r.leaderPhi.toFixed(4)}), Marża = ${r.margin.toFixed(4)} nad ${r.runnerUp}`);
  }

  const html = generateHtml(rows);
  const tempHtmlPath = path.resolve('./temp_heatmap.html');
  fs.writeFileSync(tempHtmlPath, html, 'utf-8');

  console.log('Uruchamianie przeglądarki Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1440,
    height: 1080,
    deviceScaleFactor: 2,
  });

  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });

  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({
    width: 1440,
    height: bodyHeight,
    deviceScaleFactor: 2,
  });

  console.log(`Zapisywanie zrzutu ekranu do ${outputPath}...`);
  await page.screenshot({
    path: outputPath,
    fullPage: true,
  });

  await browser.close();
  fs.unlinkSync(tempHtmlPath);
  console.log('Gotowe! Wykres heatmapy został wygenerowany pomyślnie.');
}

run().catch((err) => {
  console.error('Błąd podczas generowania heatmapy:', err);
  process.exit(1);
});
