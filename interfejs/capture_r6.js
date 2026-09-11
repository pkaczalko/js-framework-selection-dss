import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = process.env.FIGURES_DIR ?? path.resolve('figures');

async function capture() {
  console.log('Uruchamianie Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 2000,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));

  await page.click('#btn-compute');
  await new Promise((r) => setTimeout(r, 800));

  const section3 = await page.$('main section:nth-of-type(3)');
  if (section3) {
    const outPanel = path.join(targetDir, 'r6 - dss-panel-wynikow.png');
    await section3.screenshot({ path: outPanel });
    console.log('Zapisano panel wyników:', outPanel);
  }

  await browser.close();
}

capture().catch((err) => {
  console.error('Błąd:', err);
  process.exit(1);
});
