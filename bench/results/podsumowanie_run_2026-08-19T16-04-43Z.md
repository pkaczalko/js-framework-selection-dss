# Podsumowanie serii pomiarowej klasy A

**runId:** `2026-08-19T16-04-43Z`  
**Status:** 6/6 OK  
**Źródło:** pomiar własny  
**Start:** 2026-08-19T16:04:47.186Z  
**Koniec (raport):** 2026-08-19T17:10:51.299Z  
**Czas przebiegu:** ~66 min (2026-08-19T16:04:47.186Z → 2026-08-19T17:10:51.299Z)

Skrót orkiestratora: `bench/results/report_2026-08-19T16-04-43Z.md`. Surowe JSON: `bench/results/raw/run_2026-08-19T16-04-43Z/`. Log: `bench/logs/run_2026-08-19T16-04-43Z.log`. CSV: `bench/results/summary.csv`.

## 1. Środowisko

| Pole | Wartość |
|---|---|
| Node | v24.15.0 |
| npm | 11.12.1 |
| Chrome | 152.0.7977.42 |
| CHROME_PATH | `%LOCALAPPDATA%\ChromeForTesting\chrome\win64-152.0.7977.42\chrome-win64\chrome.exe` |
| OS | Windows_NT 10.0.26200 (x64) |
| CPU | AMD Ryzen 5 7535HS with Radeon Graphics |
| RAM | 13.7 GB |
| git SHA (HEAD w metadanych) | `68b4d7d102eddcb0f9365625a90317e752e5b657` |
| Lighthouse | 13.4.1 |
| zlib gzip | poziom 9 |

Uwaga: SHA w metadanych to commit HEAD; poprawka wyścigu Svelte była w working tree (chunk `index-C1cdMGIZ.js`, 41344 B).

## 2. Protokół

| Parametr | Wartość |
|---|---|
| Profil Lighthouse | **mobile** (domyślny throttling) |
| Powtórzenia tbt/memory | 5, agregacja: **mediana** |
| TBT | `/?limit=20` |
| Memory | `/?limit=1000` , CDP `Performance.getMetrics` (`JSHeapUsedSize`), 2× GC |
| Bundle | gzip JS+CSS z HTML `/` (initial load), bez CDN |
| Pauza ten sam FW | 30–60 s |
| Pauza między FW | 120–180 s |
| Chrome | osobna świeża instancja Chrome na każde powtórzenie tbt i memory (uzasadnienie: bench/memory/measure.mjs) |
| Kolejność | wylosowana raz: **next → nuxt → react → svelte → vue → angular** |

## 3. Mediany do PROMETHEE II (kierunek MIN)

| Framework | Status | bundle (B gzip) | bundle (KB) | TBT (ms) | memory (B) | memory (MB) |
|---|---|---:|---:|---:|---:|---:|
| next | OK | 183331 | 179.0 | 44 | 10642952 | 10.15 |
| nuxt | OK | 85294 | 83.3 | 27.5 | 43773664 | 41.75 |
| react | OK | 93984 | 91.8 | 0 | 13344472 | 12.73 |
| svelte | OK | 41344 | 40.4 | 13 | 16992420 | 16.21 |
| vue | OK | 41824 | 40.8 | 18 | 26044384 | 24.84 |
| angular | OK | 114795 | 112.1 | 89 | 20691776 | 19.73 |

Ranking MIN (tylko kompletne metryki):
- **bundle:** 1. svelte (41344 B / 40.4 KB); 2. vue (41824 B / 40.8 KB); 3. nuxt (85294 B / 83.3 KB); 4. react (93984 B / 91.8 KB); 5. angular (114795 B / 112.1 KB); 6. next (183331 B / 179.0 KB)
- **tbt:** 1. react (0 ms); 2. svelte (13 ms); 3. vue (18 ms); 4. nuxt (27.5 ms); 5. next (44 ms); 6. angular (89 ms)
- **memory:** 1. next (10.15 MB); 2. react (12.73 MB); 3. svelte (16.21 MB); 4. angular (19.73 MB); 5. vue (24.84 MB); 6. nuxt (41.75 MB)

## 4. TBT — wszystkie powtórzenia

Scenariusz: `/?limit=20`, form-factor mobile.

| Framework | n | mediana | min | max | surowe (ms) | FCP med. (ms) | TTI med. (ms) |
|---|---:|---:|---:|---:|---|---:|---:|
| next | 5 | 44 | 39 | 58 | 43; 54; 44; 58; 39 | 1385 | 2542 |
| nuxt | 5 | 27.5 | 22 | 30.5 | 26; 28.5; 22; 27.5; 30.5 | 2705 | 3219 |
| react | 5 | 0 | 0 | 0 | 0; 0; 0; 0; 0 | 1803 | 2117 |
| svelte | 5 | 13 | 11 | 18 | 18; 11; 15; 13; 13 | 1382 | 2026 |
| vue | 5 | 18 | 11 | 19 | 18; 19; 11; 18; 18 | 1504 | 2032 |
| angular | 5 | 89 | 87 | 103 | 103; 87; 89; 88; 98 | 3766 | 4459 |

React TBT = 0 ms we wszystkich 5 próbach. TBT sumuje tylko (długość − 50 ms) dla tasków > 50 ms między FCP a TTI. Zero przy FCP ≈ 1803 ms i TTI ≈ 2117 ms jest legalne (strona się namalowała).

### 4.1. Próby TBT (FCP / LCP / TTI / Speed Index)

#### next

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 43 | 1385 | 2493 | 2532 | 1385 | 2026-08-19T16:09:36.968Z |
| 2 | 54 | 1385 | 2363 | 2513 | 1385 | 2026-08-19T16:10:43.020Z |
| 3 | 44 | 1534 | 2719 | 2719 | 1534 | 2026-08-19T16:11:48.207Z |
| 4 | 58 | 1383 | 2511 | 2542 | 1383 | 2026-08-19T16:12:52.358Z |
| 5 | 39 | 1382 | 2710 | 2710 | 1382 | 2026-08-19T16:13:45.545Z |

#### nuxt

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 26 | 2709 | 2859 | 3246 | 2709 | 2026-08-19T16:20:39.864Z |
| 2 | 28.5 | 2705 | 2855 | 3218 | 2705 | 2026-08-19T16:21:29.676Z |
| 3 | 22 | 2704 | 2854 | 3140 | 2704 | 2026-08-19T16:22:34.277Z |
| 4 | 27.5 | 2783 | 3012 | 3219 | 2783 | 2026-08-19T16:23:36.958Z |
| 5 | 30.5 | 2705 | 2855 | 3247 | 2705 | 2026-08-19T16:24:27.930Z |

#### react

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0 | 1806 | 2119 | 2119 | 1806 | 2026-08-19T16:31:59.361Z |
| 2 | 0 | 1805 | 2116 | 2116 | 1805 | 2026-08-19T16:32:44.844Z |
| 3 | 0 | 1802 | 1802 | 1802 | 1802 | 2026-08-19T16:33:29.806Z |
| 4 | 0 | 1803 | 2117 | 2117 | 1803 | 2026-08-19T16:34:37.490Z |
| 5 | 0 | 1803 | 2117 | 2117 | 1803 | 2026-08-19T16:35:20.279Z |

#### svelte

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 18 | 1382 | 1952 | 1959 | 1382 | 2026-08-19T16:43:17.831Z |
| 2 | 11 | 1382 | 1902 | 1902 | 1382 | 2026-08-19T16:44:03.866Z |
| 3 | 15 | 1381 | 2053 | 2053 | 1381 | 2026-08-19T16:44:41.422Z |
| 4 | 13 | 1382 | 2026 | 2026 | 1382 | 2026-08-19T16:45:29.003Z |
| 5 | 13 | 1381 | 2102 | 2102 | 1381 | 2026-08-19T16:46:30.685Z |

#### vue

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 18 | 1505 | 2027 | 2027 | 1505 | 2026-08-19T16:53:20.402Z |
| 2 | 19 | 1504 | 2060 | 2060 | 1504 | 2026-08-19T16:54:22.412Z |
| 3 | 11 | 1504 | 2032 | 2032 | 1504 | 2026-08-19T16:55:14.381Z |
| 4 | 18 | 1503 | 2025 | 2025 | 1503 | 2026-08-19T16:56:02.307Z |
| 5 | 18 | 1502 | 2104 | 2104 | 1502 | 2026-08-19T16:56:50.196Z |

#### angular

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 103 | 3798 | 4493 | 4493 | 3798 | 2026-08-19T17:03:36.792Z |
| 2 | 87 | 3726 | 4415 | 4415 | 3726 | 2026-08-19T17:04:40.740Z |
| 3 | 89 | 3766 | 4459 | 4459 | 3766 | 2026-08-19T17:05:18.927Z |
| 4 | 88 | 3749 | 4443 | 4443 | 3749 | 2026-08-19T17:06:01.725Z |
| 5 | 98 | 3781 | 4480 | 4480 | 3781 | 2026-08-19T17:06:42.002Z |

## 5. Memory — wszystkie powtórzenia

Scenariusz: `/?limit=1000`, used JS heap po GC.

| Framework | n | mediana (MB) | surowe (MB) | surowe (B) |
|---|---:|---:|---|---|
| next | 5 | 10.15 | 10.15; 10.15; 10.15; 10.15; 14.84 | 10641836; 10640544; 10645812; 10642952; 15564164 |
| nuxt | 5 | 41.75 | 41.75; 41.75; 41.75; 41.74; 41.75 | 43777384; 43774292; 43773388; 43771704; 43773664 |
| react | 5 | 12.73 | 12.73; 12.73; 12.73; 12.73; 12.73 | 13344392; 13344676; 13343964; 13344472; 13344620 |
| svelte | 5 | 16.21 | 16.20; 16.20; 16.21; 16.21; 16.21 | 16991740; 16988672; 16992708; 16992504; 16992420 |
| vue | 5 | 24.84 | 24.81; 24.84; 24.84; 24.82; 24.84 | 26019752; 26045304; 26044384; 26021164; 26046148 |
| angular | 5 | 19.73 | 19.73; 19.73; 19.73; 19.73; 19.73 | 20693096; 20692408; 20690932; 20691776; 20690980 |

### 5.1. Próby memory (heap, DOM, karty)

#### next (`http://localhost:4300/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 10641836 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10641836 → 10641836 |
| 2 | 10640544 | 10.15 | 11010048 | 1000 | 19093 | 5306 | 1 | 10640544 → 10640544 |
| 3 | 10645812 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10645812 → 10645812 |
| 4 | 10642952 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10642952 → 10642952 |
| 5 | 15564164 | 14.84 | 16252928 | 1000 | 19094 | 5306 | 1 | 15564164 → 15564164 |

#### nuxt (`http://localhost:4400/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 43777384 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43777384 → 43777384 |
| 2 | 43774292 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43774292 → 43774292 |
| 3 | 43773388 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43773388 → 43773388 |
| 4 | 43771704 | 41.74 | 44576768 | 1000 | 22100 | 3011 | 1 | 43771704 → 43771704 |
| 5 | 43773664 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43773664 → 43773664 |

#### react (`http://localhost:4173/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 13344392 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13344392 → 13344392 |
| 2 | 13344676 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344676 → 13344676 |
| 3 | 13343964 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13343964 → 13343964 |
| 4 | 13344472 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344472 → 13344472 |
| 5 | 13344620 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344620 → 13344620 |

#### svelte (`http://localhost:4175/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 16991740 | 16.20 | 17563648 | 1000 | 37245 | 5 | 2 | 16991740 → 16991740 |
| 2 | 16988672 | 16.20 | 18087936 | 1000 | 37245 | 5 | 2 | 16988672 → 16988672 |
| 3 | 16992708 | 16.21 | 17825792 | 1000 | 37245 | 5 | 2 | 16992708 → 16992708 |
| 4 | 16992504 | 16.21 | 18087936 | 1000 | 37245 | 5 | 2 | 16992504 → 16992504 |
| 5 | 16992420 | 16.21 | 17563648 | 1000 | 37245 | 5 | 2 | 16992420 → 16992420 |

#### vue (`http://localhost:4174/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 26019752 | 24.81 | 26488832 | 1000 | 22084 | 3010 | 1 | 26019752 → 26019752 |
| 2 | 26045304 | 24.84 | 26750976 | 1000 | 22084 | 3010 | 1 | 26045304 → 26045304 |
| 3 | 26044384 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26044384 → 26044384 |
| 4 | 26021164 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26021164 → 26021164 |
| 5 | 26046148 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26046148 → 26046148 |

#### angular (`http://localhost:4500/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 20693096 | 19.73 | 21495808 | 1000 | 23096 | 5014 | 1 | 20693096 → 20693096 |
| 2 | 20692408 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20692408 → 20692408 |
| 3 | 20690932 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20690932 → 20690932 |
| 4 | 20691776 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20691776 → 20691776 |
| 5 | 20690980 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20690980 → 20690980 |

## 6. Bundle (initial load `/`)

Definicja: gzip-9 lokalnych JS/CSS z HTML `/` (`script`, `stylesheet`, `modulepreload`). `distDump` = walk katalogu dist (diagnostyka, nie metryka PROMETHEE).

| Framework | gzip (B) | gzip (KB) | raw (B) | plików | stable | distDump gzip (B / plików) |
|---|---:|---:|---:|---:|---|---|
| next | 183331 | 179.0 | 604042 | 9 | tak | 195243 / 19 |
| nuxt | 85294 | 83.3 | 227405 | 12 | tak | 116690 / 28 |
| react | 93984 | 91.8 | 313954 | 2 | tak | 93984 / 2 |
| svelte | 41344 | 40.4 | 133907 | 2 | tak | 41344 / 2 |
| vue | 41824 | 40.8 | 119915 | 2 | tak | 61725 / 9 |
| angular | 114795 | 112.1 | 390367 | 2 | tak | 114795 / 2 |

Dla każdego z 6 zmierzonych: `valueGzipBytes == build1.gzipBytes == build2.gzipBytes` i ta sama lista URL.

### next

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/_next/static/chunks/09r8cx-jn5loi.js` | 229156 | 71470 |
| `/_next/static/chunks/2hbx0u5pc3csk.js` | 160090 | 43722 |
| `/_next/static/chunks/0cz1d0mv5g_q7.js` | 112594 | 39520 |
| `/_next/static/chunks/3jtwmycxydvp0.js` | 34718 | 8680 |
| `/_next/static/chunks/1yy4evsq4js9c.js` | 27738 | 8130 |
| `/_next/static/chunks/0a1badl28xsv9.css` | 19052 | 3972 |
| `/_next/static/chunks/turbopack-1x7mm-turn0p9.js` | 9652 | 3829 |
| `/_next/static/chunks/2_jiyffbl1jbm.js` | 5678 | 2039 |
| `/_next/static/chunks/310vm2bl3xxpt.js` | 5364 | 1969 |

### nuxt

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/_nuxt/CDOaBadr.js` | 91441 | 35399 |
| `/_nuxt/CNadt6uC.js` | 55584 | 20484 |
| `/_nuxt/B5OXs9Kn.js` | 14391 | 5638 |
| `/_nuxt/DlNY6ErF.js` | 11333 | 4993 |
| `/_nuxt/entry.CA0OxEmw.css` | 18838 | 3987 |
| `/_nuxt/G_5q1KFl.js` | 9224 | 3870 |
| `/_nuxt/C-Beaxz0.js` | 9323 | 3748 |
| `/_nuxt/C-10wMc_.js` | 7098 | 2851 |
| `/_nuxt/BMOQBVvJ.js` | 3007 | 1419 |
| `/_nuxt/BBeByjud.js` | 3490 | 1411 |
| `/_nuxt/CfiitD0k.js` | 3540 | 1361 |
| `/_nuxt/BBSTa77M.js` | 136 | 133 |

### react

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-B-02nqmS.js` | 294917 | 90009 |
| `/assets/index-G7tt2fdG.css` | 19037 | 3975 |

### svelte

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-C1cdMGIZ.js` | 114806 | 37356 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

### vue

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-HycXeBU5.js` | 100814 | 37836 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

### angular

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/main-7HG4VLMA.js` | 370337 | 110746 |
| `/styles-V7LOWGDA.css` | 20030 | 4049 |

## 7. Porty i czasy bloku per framework

| Framework | port | origin | startedAt | finishedAt |
|---|---:|---|---|---|
| next | 4300 | http://localhost:4300 | 2026-08-19T16:09:16.871Z | 2026-08-19T16:17:48.062Z |
| nuxt | 4400 | http://localhost:4400 | 2026-08-19T16:20:10.071Z | 2026-08-19T16:29:17.845Z |
| react | 4173 | http://localhost:4173 | 2026-08-19T16:31:52.847Z | 2026-08-19T16:40:05.921Z |
| svelte | 4175 | http://localhost:4175 | 2026-08-19T16:42:59.931Z | 2026-08-19T16:51:08.132Z |
| vue | 4174 | http://localhost:4174 | 2026-08-19T16:53:13.136Z | 2026-08-19T17:01:29.432Z |
| angular | 4500 | http://localhost:4500 | 2026-08-19T17:03:30.435Z | 2026-08-19T17:10:51.298Z |

## 8. Uwagi metodyczne do tej serii

1. Seria **6/6 OK** z potwierdzoną wersją Chrome, `buildStability` = initial load.
2. Poprawka wyścigu Svelte była w working tree (chunk `index-C1cdMGIZ.js`, 41344 B).
3. TBT: React TBT 5× 0 ms (legalne zero).
4. Memory: wszystkie zmierzone FW po 5× 1000 kart; Next jednomodalny ~10.15 MB.
5. Pełne obiekty CDP `Performance.getMetrics` i raporty LHR są w `raw/run_2026-08-19T16-04-43Z/` (nie powielane tutaj).

