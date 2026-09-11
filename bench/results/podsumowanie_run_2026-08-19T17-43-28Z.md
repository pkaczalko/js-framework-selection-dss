# Podsumowanie serii pomiarowej klasy A

**runId:** `2026-08-19T17-43-28Z`  
**Status:** 6/6 OK  
**Źródło:** pomiar własny  
**Start:** 2026-08-19T17:43:30.565Z  
**Koniec (raport):** 2026-08-19T18:47:19.220Z  
**Czas przebiegu:** ~64 min (2026-08-19T17:43:30.565Z → 2026-08-19T18:47:19.220Z)

Skrót orkiestratora: `bench/results/report_2026-08-19T17-43-28Z.md`. Surowe JSON: `bench/results/raw/run_2026-08-19T17-43-28Z/`. Log: `bench/logs/run_2026-08-19T17-43-28Z.log`. CSV: `bench/results/summary.csv`.

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
| Kolejność | wylosowana raz: **angular → next → vue → react → svelte → nuxt** |

## 3. Mediany do PROMETHEE II (kierunek MIN)

| Framework | Status | bundle (B gzip) | bundle (KB) | TBT (ms) | memory (B) | memory (MB) |
|---|---|---:|---:|---:|---:|---:|
| angular | OK | 114795 | 112.1 | 89 | 20689788 | 19.73 |
| next | OK | 183331 | 179.0 | 43 | 10644352 | 10.15 |
| vue | OK | 41824 | 40.8 | 14 | 26022836 | 24.82 |
| react | OK | 93984 | 91.8 | 0 | 13343964 | 12.73 |
| svelte | OK | 41344 | 40.4 | 14 | 16991664 | 16.2 |
| nuxt | OK | 85294 | 83.3 | 24 | 43778220 | 41.75 |

Ranking MIN (tylko kompletne metryki):
- **bundle:** 1. svelte (41344 B / 40.4 KB); 2. vue (41824 B / 40.8 KB); 3. nuxt (85294 B / 83.3 KB); 4. react (93984 B / 91.8 KB); 5. angular (114795 B / 112.1 KB); 6. next (183331 B / 179.0 KB)
- **tbt:** 1. react (0 ms); 2. vue (14 ms); 3. svelte (14 ms); 4. nuxt (24 ms); 5. next (43 ms); 6. angular (89 ms)
- **memory:** 1. next (10.15 MB); 2. react (12.73 MB); 3. svelte (16.2 MB); 4. angular (19.73 MB); 5. vue (24.82 MB); 6. nuxt (41.75 MB)

## 4. TBT — wszystkie powtórzenia

Scenariusz: `/?limit=20`, form-factor mobile.

| Framework | n | mediana | min | max | surowe (ms) | FCP med. (ms) | TTI med. (ms) |
|---|---:|---:|---:|---:|---|---:|---:|
| angular | 5 | 89 | 88 | 97 | 89; 89; 88; 88; 97 | 3812 | 4513 |
| next | 5 | 43 | 39 | 52 | 39; 52; 48; 41; 43 | 1384 | 2564 |
| vue | 5 | 14 | 12 | 22 | 15; 14; 12; 22; 14 | 1503 | 2029 |
| react | 5 | 0 | 0 | 36 | 0; 36; 0; 0; 0 | 1803 | 2115 |
| svelte | 5 | 14 | 12 | 20 | 14; 12; 20; 14; 17 | 1381 | 2024 |
| nuxt | 5 | 24 | 21.5 | 26 | 26; 24; 24.5; 21.5; 22.5 | 2705 | 3206 |

React TBT mediana 0 ms (surowe: 0; 36; 0; 0; 0). Zero jest legalne, gdy taski między FCP a TTI nie przekraczają 50 ms.

### 4.1. Próby TBT (FCP / LCP / TTI / Speed Index)

#### angular

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 89 | 3846 | 4556 | 4556 | 3846 | 2026-08-19T17:46:09.835Z |
| 2 | 89 | 3829 | 4526 | 4526 | 3829 | 2026-08-19T17:47:04.331Z |
| 3 | 88 | 3770 | 4463 | 4463 | 3770 | 2026-08-19T17:48:06.528Z |
| 4 | 88 | 3807 | 4504 | 4504 | 3807 | 2026-08-19T17:48:58.903Z |
| 5 | 97 | 3812 | 4513 | 4513 | 3812 | 2026-08-19T17:49:41.225Z |

#### next

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 39 | 1530 | 2575 | 2575 | 1530 | 2026-08-19T17:57:00.199Z |
| 2 | 52 | 1384 | 2510 | 2510 | 1384 | 2026-08-19T17:58:07.215Z |
| 3 | 48 | 1384 | 2355 | 2505 | 1384 | 2026-08-19T17:59:00.327Z |
| 4 | 41 | 1527 | 2564 | 2564 | 1527 | 2026-08-19T17:59:38.579Z |
| 5 | 43 | 1383 | 2712 | 2712 | 1383 | 2026-08-19T18:00:22.686Z |

#### vue

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 15 | 1504 | 2028 | 2028 | 1504 | 2026-08-19T18:07:26.463Z |
| 2 | 14 | 1505 | 2031 | 2031 | 1505 | 2026-08-19T18:08:12.489Z |
| 3 | 12 | 1503 | 2029 | 2029 | 1503 | 2026-08-19T18:09:01.489Z |
| 4 | 22 | 1502 | 2033 | 2033 | 1502 | 2026-08-19T18:09:53.407Z |
| 5 | 14 | 1503 | 2029 | 2029 | 1503 | 2026-08-19T18:10:51.492Z |

#### react

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0 | 1804 | 1804 | 1804 | 1804 | 2026-08-19T18:17:39.306Z |
| 2 | 36 | 1803 | 2115 | 2115 | 1803 | 2026-08-19T18:18:37.775Z |
| 3 | 0 | 1802 | 2114 | 2114 | 1802 | 2026-08-19T18:19:42.564Z |
| 4 | 0 | 1803 | 2119 | 2119 | 1803 | 2026-08-19T18:20:45.539Z |
| 5 | 0 | 1804 | 2117 | 2117 | 1804 | 2026-08-19T18:21:39.250Z |

#### svelte

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 14 | 1383 | 2024 | 2024 | 1383 | 2026-08-19T18:28:15.635Z |
| 2 | 12 | 1381 | 1872 | 1872 | 1381 | 2026-08-19T18:29:03.641Z |
| 3 | 20 | 1382 | 1953 | 1960 | 1382 | 2026-08-19T18:30:00.385Z |
| 4 | 14 | 1381 | 2054 | 2054 | 1381 | 2026-08-19T18:30:59.148Z |
| 5 | 17 | 1381 | 2054 | 2054 | 1381 | 2026-08-19T18:32:00.136Z |

#### nuxt

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 26 | 2605 | 2862 | 2943 | 2605 | 2026-08-19T18:38:34.381Z |
| 2 | 24 | 2707 | 2857 | 3214 | 2707 | 2026-08-19T18:39:42.865Z |
| 3 | 24.5 | 2707 | 2857 | 3121 | 2707 | 2026-08-19T18:40:43.848Z |
| 4 | 21.5 | 2704 | 2854 | 3206 | 2704 | 2026-08-19T18:41:49.822Z |
| 5 | 22.5 | 2705 | 2855 | 3207 | 2705 | 2026-08-19T18:42:54.373Z |

## 5. Memory — wszystkie powtórzenia

Scenariusz: `/?limit=1000`, used JS heap po GC.

| Framework | n | mediana (MB) | surowe (MB) | surowe (B) |
|---|---:|---:|---|---|
| angular | 5 | 19.73 | 19.73; 19.73; 19.73; 19.73; 19.73 | 20687452; 20689788; 20684992; 20690224; 20693208 |
| next | 5 | 10.15 | 10.15; 10.15; 10.15; 14.84; 10.15 | 10642032; 10644352; 10639964; 15565484; 10646832 |
| vue | 5 | 24.82 | 24.84; 24.82; 24.84; 24.82; 24.82 | 26045652; 26020692; 26045000; 26022836; 26022756 |
| react | 5 | 12.73 | 12.73; 12.73; 12.73; 12.73; 12.73 | 13344612; 13343964; 13343996; 13343916; 13343944 |
| svelte | 5 | 16.2 | 16.20; 16.20; 16.21; 16.20; 16.20 | 16991664; 16989372; 16992544; 16992008; 16991060 |
| nuxt | 5 | 41.75 | 41.75; 41.66; 41.76; 41.75; 41.75 | 43778220; 43682408; 43786552; 43779836; 43777324 |

### 5.1. Próby memory (heap, DOM, karty)

#### angular (`http://localhost:4500/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 20687452 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20687452 → 20687452 |
| 2 | 20689788 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20689788 → 20689788 |
| 3 | 20684992 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20684992 → 20684992 |
| 4 | 20690224 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20690224 → 20690224 |
| 5 | 20693208 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20693208 → 20693208 |

#### next (`http://localhost:4300/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 10642032 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10642032 → 10642032 |
| 2 | 10644352 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10644352 → 10644352 |
| 3 | 10639964 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10639964 → 10639964 |
| 4 | 15565484 | 14.84 | 16252928 | 1000 | 19094 | 5306 | 1 | 15565484 → 15565484 |
| 5 | 10646832 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10646832 → 10646832 |

#### vue (`http://localhost:4174/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 26045652 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26045652 → 26045652 |
| 2 | 26020692 | 24.82 | 26750976 | 1000 | 22084 | 3010 | 1 | 26020692 → 26020692 |
| 3 | 26045000 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26045000 → 26045000 |
| 4 | 26022836 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26022836 → 26022836 |
| 5 | 26022756 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26022756 → 26022756 |

#### react (`http://localhost:4173/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 13344612 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344612 → 13344612 |
| 2 | 13343964 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13343964 → 13343964 |
| 3 | 13343996 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13343996 → 13343996 |
| 4 | 13343916 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13343916 → 13343916 |
| 5 | 13343944 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13343944 → 13343944 |

#### svelte (`http://localhost:4175/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 16991664 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16991664 → 16991664 |
| 2 | 16989372 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16989372 → 16989372 |
| 3 | 16992544 | 16.21 | 17563648 | 1000 | 37245 | 5 | 2 | 16992544 → 16992544 |
| 4 | 16992008 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16992008 → 16992008 |
| 5 | 16991060 | 16.20 | 18087936 | 1000 | 37245 | 5 | 2 | 16991060 → 16991060 |

#### nuxt (`http://localhost:4400/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 43778220 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43778220 → 43778220 |
| 2 | 43682408 | 41.66 | 44576768 | 1000 | 22100 | 3011 | 1 | 43682408 → 43682408 |
| 3 | 43786552 | 41.76 | 44576768 | 1000 | 22100 | 3011 | 1 | 43786552 → 43786552 |
| 4 | 43779836 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43779836 → 43779836 |
| 5 | 43777324 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43777324 → 43777324 |

## 6. Bundle (initial load `/`)

Definicja: gzip-9 lokalnych JS/CSS z HTML `/` (`script`, `stylesheet`, `modulepreload`). `distDump` = walk katalogu dist (diagnostyka, nie metryka PROMETHEE).

| Framework | gzip (B) | gzip (KB) | raw (B) | plików | stable | distDump gzip (B / plików) |
|---|---:|---:|---:|---:|---|---|
| angular | 114795 | 112.1 | 390367 | 2 | tak | 114795 / 2 |
| next | 183331 | 179.0 | 604042 | 9 | tak | 195243 / 19 |
| vue | 41824 | 40.8 | 119915 | 2 | tak | 61725 / 9 |
| react | 93984 | 91.8 | 313954 | 2 | tak | 93984 / 2 |
| svelte | 41344 | 40.4 | 133907 | 2 | tak | 41344 / 2 |
| nuxt | 85294 | 83.3 | 227405 | 12 | tak | 116690 / 28 |

Dla każdego z 6 zmierzonych: `valueGzipBytes == build1.gzipBytes == build2.gzipBytes` i ta sama lista URL.

### angular

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/main-7HG4VLMA.js` | 370337 | 110746 |
| `/styles-V7LOWGDA.css` | 20030 | 4049 |

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

### vue

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-HycXeBU5.js` | 100814 | 37836 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

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

## 7. Porty i czasy bloku per framework

| Framework | port | origin | startedAt | finishedAt |
|---|---:|---|---|---|
| angular | 4500 | http://localhost:4500 | 2026-08-19T17:46:03.512Z | 2026-08-19T17:54:50.397Z |
| next | 4300 | http://localhost:4300 | 2026-08-19T17:56:54.411Z | 2026-08-19T18:04:54.308Z |
| vue | 4174 | http://localhost:4174 | 2026-08-19T18:07:21.324Z | 2026-08-19T18:15:16.095Z |
| react | 4173 | http://localhost:4173 | 2026-08-19T18:17:34.101Z | 2026-08-19T18:25:28.030Z |
| svelte | 4175 | http://localhost:4175 | 2026-08-19T18:28:10.047Z | 2026-08-19T18:36:23.180Z |
| nuxt | 4400 | http://localhost:4400 | 2026-08-19T18:38:28.187Z | 2026-08-19T18:47:19.218Z |

## 8. Uwagi metodyczne do tej serii

1. Seria **6/6 OK** z potwierdzoną wersją Chrome, `buildStability` = initial load.
2. Poprawka wyścigu Svelte była w working tree (chunk `index-C1cdMGIZ.js`, 41344 B).
3. TBT: React TBT mediana 0 ms (surowe: 0; 36; 0; 0; 0).
4. Memory: wszystkie zmierzone FW po 5× 1000 kart; Next jednomodalny ~10.15 MB.
5. Pełne obiekty CDP `Performance.getMetrics` i raporty LHR są w `raw/run_2026-08-19T17-43-28Z/` (nie powielane tutaj).

