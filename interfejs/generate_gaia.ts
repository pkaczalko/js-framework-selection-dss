import { getDecisionMatrix, getManualProfiles, CRITERION_ORDER_14 } from './engine/dss_model14';
import { computePromethee } from './engine/promethee';
import { gaia } from './src/gaia';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = process.env.FIGURES_DIR ?? path.resolve('figures');

const CRIT_INFO: Record<string, { label: string; group: 'dx' | 'eco' | 'arch' | 'perf' }> = {
  bundle: { label: 'Rozmiar pakietu', group: 'perf' },
  tbt: { label: 'Total Blocking Time', group: 'perf' },
  memory: { label: 'Zużycie pamięci', group: 'perf' },
  learn: { label: 'Próg wejścia', group: 'dx' },
  dev_speed: { label: 'Szybkość developmentu', group: 'dx' },
  ecosystem: { label: 'Dojrzałość ekosystemu', group: 'eco' },
  popular: { label: 'Popularność', group: 'eco' },
  community: { label: 'Aktywność społeczności', group: 'eco' },
  lts: { label: 'Wsparcie / LTS', group: 'eco' },
  ssr: { label: 'Wsparcie SSR/SSG', group: 'arch' },
  scalability: { label: 'Skalowalność architektury', group: 'arch' },
  lcp: { label: 'Largest Contentful Paint', group: 'perf' },
  cls: { label: 'Cumulative Layout Shift', group: 'perf' },
  total_byte_weight: { label: 'Łączna masa zasobów', group: 'perf' },
};

function computeGaiaData(vol: 'N20' | 'N1000') {
  const matrix = getDecisionMatrix(vol);
  const profiles = getManualProfiles();
  const weightsBase = profiles['Podstawowy'];
  const resBase = computePromethee(matrix, weightsBase);
  const g = gaia(resBase, CRITERION_ORDER_14);

  const computePi = (weights: number[]) => {

    let piX = 0;
    let piY = 0;
    for (let j = 0; j < CRITERION_ORDER_14.length; j++) {
      piX += weights[j] * g.axes[j].x;
      piY += weights[j] * g.axes[j].y;
    }
    return { x: piX, y: piY };
  };

  const piEnterprise = computePi(profiles['Enterprise']);
  const piPerformance = computePi(profiles['Wydajność']);

  return {
    vol,
    variance: (g.varianceExplained * 100).toFixed(1),
    points: g.points,
    axes: g.axes.map((a) => ({
      ...a,
      label: CRIT_INFO[a.criterion]?.label || a.criterion,
      group: CRIT_INFO[a.criterion]?.group || 'perf',
    })),
    piBase: g.decisionAxis,
    piEnterprise,
    piPerformance,
  };
}

async function run() {
  console.log('Obliczanie danych GAIA dla N20 i N1000...');
  const dataN20 = computeGaiaData('N20');
  const dataN1000 = computeGaiaData('N1000');

  console.log(`N20 wariancja: ${dataN20.variance}%, N1000 wariancja: ${dataN1000.variance}%`);

  const htmlContent = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      padding: 24px;
      width: 1400px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h2 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .header p {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .panel {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 18px 16px 14px;
      background: #f8fafc;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    }
    .badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .chart-container {
      position: relative;
      width: 630px;
      height: 520px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    svg {
      width: 100%;
      height: 100%;
    }
    .legend {
      margin-top: 20px;
      padding: 12px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      font-size: 13px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }
    .legend-line {
      width: 22px;
      height: 3px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Dwuwymiarowa płaszczyzna GAIA (Geometrical Analysis for Interactive Aid)</h2>
    <p>Rzutowanie PCA macierzy jednokryterialnych przepływów netto dla 6 technologii i 14 kryteriów decyzyjnych</p>
  </div>

  <div class="grid">
    <div class="panel">
      <div class="panel-title">
        <span>Panel A: Scenariusz bazowy N20</span>
        <span class="badge">Wariancja: ${dataN20.variance}%</span>
      </div>
      <div class="chart-container" id="svg-n20"></div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <span>Panel B: Scenariusz skalowalny N1000</span>
        <span class="badge">Wariancja: ${dataN1000.variance}%</span>
      </div>
      <div class="chart-container" id="svg-n1000"></div>
    </div>
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-color" style="background: #2563eb; border-radius: 50%;"></div>
      <strong>Alternatywy technologiczne</strong>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background: #059669;"></div>
      <span>DX i wdrożenie (learn, dev_speed)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background: #d97706;"></div>
      <span>Ekosystem i LTS (popular, ecosystem, lts, comm)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background: #7c3aed;"></div>
      <span>Architektura i SSR (ssr, scalability)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background: #0284c7;"></div>
      <span>Metryki laboratoryjne (bundle, tbt, mem, lcp, cls, bytes)</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background: #dc2626; height: 4px;"></div>
      <strong>Oś decyzyjna &pi; (kierunek kompromisu)</strong>
    </div>
  </div>

  <script>
    const dataN20 = ${JSON.stringify(dataN20)};
    const dataN1000 = ${JSON.stringify(dataN1000)};

    const GROUP_COLORS = {
      dx: '#059669',
      eco: '#d97706',
      arch: '#7c3aed',
      perf: '#0284c7'
    };

    function renderGaiaSvg(containerId, d) {
      const container = document.getElementById(containerId);
      const w = 630;
      const h = 520;
      const margin = 55;
      const cx = w / 2;
      const cy = h / 2;

      let maxVal = 2.85;

      const scaleX = (x) => cx + (x / maxVal) * (cx - margin);
      const scaleY = (y) => cy - (y / maxVal) * (cy - margin);

      let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '">';

      svg += '<defs>';
      svg += '<marker id="arrow-crit" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8"/></marker>';
      svg += '<marker id="arrow-pi" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="#dc2626"/></marker>';
      svg += '</defs>';

      [0.5, 1.0, 1.5, 2.0].forEach(r => {
        const rx = (r / maxVal) * (cx - margin);
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rx + '" fill="none" stroke="#f1f5f9" stroke-width="1.5"/>';
      });

      svg += '<line x1="' + (margin - 15) + '" y1="' + cy + '" x2="' + (w - margin + 15) + '" y2="' + cy + '" stroke="#cbd5e1" stroke-width="1"/>';
      svg += '<line x1="' + cx + '" y1="' + (margin - 15) + '" x2="' + cx + '" y2="' + (h - margin + 15) + '" stroke="#cbd5e1" stroke-width="1"/>';
      svg += '<text x="' + (w - margin + 20) + '" y="' + (cy + 4) + '" font-size="11" fill="#94a3b8" font-weight="600">u₁</text>';
      svg += '<text x="' + (cx + 4) + '" y="' + (margin - 22) + '" font-size="11" fill="#94a3b8" font-weight="600">u₂</text>';

      const maxPointNorm = Math.max(...d.points.map(p => Math.hypot(p.x, p.y)), 1e-6);
      const maxAxisNorm = Math.max(...d.axes.map(a => Math.hypot(a.x, a.y)), 1e-6);
      const axisScale = (1.25 * maxPointNorm) / maxAxisNorm;

      d.axes.forEach(a => {
        const ax = a.x * axisScale;
        const ay = a.y * axisScale;
        const x2 = scaleX(ax);
        const y2 = scaleY(ay);
        const col = GROUP_COLORS[a.group] || '#64748b';

        svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="1.6" stroke-opacity="0.75"/>';
        svg += '<circle cx="' + x2 + '" cy="' + y2 + '" r="2.5" fill="' + col + '"/>';

        const angle = Math.atan2(ay, ax);
        const labelDist = 10;
        const lx = x2 + Math.cos(angle) * labelDist;
        const ly = y2 - Math.sin(angle) * labelDist;
        const textAnchor = Math.cos(angle) > 0.35 ? 'start' : (Math.cos(angle) < -0.35 ? 'end' : 'middle');

        svg += '<text x="' + lx + '" y="' + (ly + 3.5) + '" font-size="10" fill="' + col + '" font-weight="600" text-anchor="' + textAnchor + '">' + a.criterion + '</text>';
      });

      const piNorm = Math.hypot(d.piBase.x, d.piBase.y);
      const piScale = (1.5 * maxPointNorm) / Math.max(piNorm, 1e-6);
      const piX = scaleX(d.piBase.x * piScale);
      const piY = scaleY(d.piBase.y * piScale);

      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + piX + '" y2="' + piY + '" stroke="#dc2626" stroke-width="3.2" marker-end="url(#arrow-pi)"/>';

      const piAngle = Math.atan2(d.piBase.y, d.piBase.x);
      const piLabelAnchor = Math.cos(piAngle) > 0 ? 'start' : 'end';
      const piOffsetX = Math.cos(piAngle) > 0 ? 12 : -12;
      const piOffsetY = Math.sin(piAngle) > 0 ? -8 : 14;

      svg += '<text x="' + (piX + piOffsetX) + '" y="' + (piY + piOffsetY) + '" font-size="12" fill="#dc2626" font-weight="700" text-anchor="' + piLabelAnchor + '">&pi; (Podstawowy)</text>';

      d.points.forEach(p => {
        const px = scaleX(p.x);
        const py = scaleY(p.y);

        svg += '<circle cx="' + px + '" cy="' + py + '" r="7.5" fill="#2563eb" stroke="#ffffff" stroke-width="2.5"/>';

        const isReact = p.alternative === 'React';
        const isNext = p.alternative === 'Next.js';
        const isAngular = p.alternative === 'Angular';
        const isNuxt = p.alternative === 'Nuxt.js';

        let offsetY = -12;
        let offsetX = 0;
        let anchor = 'middle';

        if (isAngular) { offsetX = -12; anchor = 'end'; }
        else if (isNuxt) { offsetY = 18; }
        else if (isReact) { offsetY = -13; }
        else if (isNext) { offsetX = -12; anchor = 'end'; }

        svg += '<text x="' + (px + offsetX) + '" y="' + (py + offsetY) + '" font-size="12.5" fill="#0f172a" font-weight="700" text-anchor="' + anchor + '">' + p.alternative + '</text>';
      });

      svg += '</svg>';
      container.innerHTML = svg;
    }

    renderGaiaSvg('svg-n20', dataN20);
    renderGaiaSvg('svg-n1000', dataN1000);
  </script>
</body>
</html>
  `;

  const htmlPath = path.join(targetDir, 'gaia_render.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('Zapisano szablon HTML:', htmlPath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1400, height: 750, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const outImage = path.join(targetDir, 'r6 - gaia-pelna.png');
  await page.screenshot({ path: outImage, fullPage: true });
  console.log('Wygenerowano wykres GAIA:', outImage);

  await browser.close();
  fs.unlinkSync(htmlPath);
  console.log('Gotowe!');
}

run().catch((err) => {
  console.error('Błąd:', err);
  process.exit(1);
});
