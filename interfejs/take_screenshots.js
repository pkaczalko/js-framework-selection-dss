import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = process.env.FIGURES_DIR ?? path.resolve('figures');

async function capture() {
  console.log('Uruchamianie przeglądarki Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 1050,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  console.log('Nawigacja do http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  await new Promise((r) => setTimeout(r, 600));

  console.log('Wykonywanie zrzutu strony po załadowaniu dla Rozdziału 5...');
  const outputPath = path.join(targetDir, 'r5 - dss-interfejs.png');
  await page.screenshot({
    path: outputPath,
    fullPage: true,
  });

  console.log(`Zrzut został pomyślnie zapisany: ${outputPath}`);
  await browser.close();
}

capture().catch((err) => {
  console.error('Błąd podczas wykonywania zrzutu:', err);
  process.exit(1);
});
