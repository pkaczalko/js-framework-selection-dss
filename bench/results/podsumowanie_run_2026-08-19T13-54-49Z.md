# Podsumowanie serii pomiarowej klasy A

**runId:** `2026-08-19T13-54-49Z`  
**Status:** 6/6 OK  
**Źródło:** pomiar własny  
**Start:** 2026-08-19T13:54:53.469Z  
**Koniec (raport):** 2026-08-19T15:01:31.822Z  
**Czas przebiegu:** ~67 min (2026-08-19T13:54:53.469Z → 2026-08-19T15:01:31.822Z)

Skrót orkiestratora: `bench/results/report_2026-08-19T13-54-49Z.md`. Surowe JSON: `bench/results/raw/run_2026-08-19T13-54-49Z/`. Log: `bench/logs/run_2026-08-19T13-54-49Z.log`. CSV: `bench/results/summary.csv`.

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
| Lighthouse | 13.4.1 (z LHR) |
| zlib gzip | poziom 9 |

Uwaga: SHA w metadanych to commit HEAD; poprawka wyścigu Svelte (`router.svelte.ts`, `HomeView.svelte`) była w working tree (chunk `index-C1cdMGIZ.js`, 41344 B).

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
| Kolejność | wylosowana raz: **vue → svelte → angular → next → nuxt → react** |

## 3. Mediany do PROMETHEE II (kierunek MIN)

| Framework | Status | bundle (B gzip) | bundle (KB) | TBT (ms) | memory (B) | memory (MB) |
|---|---|---:|---:|---:|---:|---:|
| vue | OK | 41824 | 40.8 | 23 | 26022636 | 24.82 |
| svelte | OK | 41344 | 40.4 | 12 | 16991744 | 16.2 |
| angular | OK | 114795 | 112.1 | 95 | 20689068 | 19.73 |
| next | OK | 183331 | 179.0 | 33 | 10645636 | 10.15 |
| nuxt | OK | 85294 | 83.3 | 28 | 43775168 | 41.75 |
| react | OK | 93984 | 91.8 | 0 | 13344020 | 12.73 |

Ranking MIN:
- **bundle:** 1. svelte (41344 B / 40.4 KB); 2. vue (41824 B / 40.8 KB); 3. nuxt (85294 B / 83.3 KB); 4. react (93984 B / 91.8 KB); 5. angular (114795 B / 112.1 KB); 6. next (183331 B / 179.0 KB)
- **tbt:** 1. react (0 ms); 2. svelte (12 ms); 3. vue (23 ms); 4. nuxt (28 ms); 5. next (33 ms); 6. angular (95 ms)
- **memory:** 1. next (10.15 MB); 2. react (12.73 MB); 3. svelte (16.2 MB); 4. angular (19.73 MB); 5. vue (24.82 MB); 6. nuxt (41.75 MB)

## 4. TBT — wszystkie powtórzenia

Scenariusz: `/?limit=20`, form-factor mobile.

| Framework | n | mediana | min | max | surowe (ms) | FCP med. (ms) | TTI med. (ms) |
|---|---:|---:|---:|---:|---|---:|---:|
| vue | 5 | 23 | 19 | 95 | 95; 23; 19; 21; 30 | 1504 | 2034 |
| svelte | 5 | 12 | 9 | 14 | 14; 9; 12; 14; 10 | 1382 | 2030 |
| angular | 5 | 95 | 86 | 105 | 105; 95; 88; 86; 96 | 3789 | 4483 |
| next | 5 | 33 | 29 | 47 | 32; 46; 47; 29; 33 | 1383 | 2506 |
| nuxt | 5 | 28 | 21 | 93 | 45; 93; 26; 28; 21 | 2706 | 3219 |
| react | 5 | 0 | 0 | 0 | 0; 0; 0; 0; 0 | 1804 | 2117 |

React TBT = 0 ms we wszystkich 5 próbach. TBT sumuje tylko (długość − 50 ms) dla tasków > 50 ms między FCP a TTI. Zero przy FCP ≈ 1804 ms i TTI ≈ 2117 ms jest legalne (strona się namalowała).

### 4.1. Próby TBT (FCP / LCP / TTI / Speed Index)

#### vue

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 95 | 1505 | 2112 | 2112 | 1505 | 2026-08-19T14:00:08.029Z |
| 2 | 23 | 1505 | 2034 | 2034 | 1505 | 2026-08-19T14:00:59.814Z |
| 3 | 19 | 1504 | 2027 | 2027 | 1504 | 2026-08-19T14:01:47.610Z |
| 4 | 21 | 1503 | 2030 | 2030 | 1503 | 2026-08-19T14:02:47.564Z |
| 5 | 30 | 1502 | 2109 | 2109 | 1502 | 2026-08-19T14:03:38.360Z |

#### svelte

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 14 | 1382 | 2055 | 2055 | 1382 | 2026-08-19T14:10:43.345Z |
| 2 | 9 | 1382 | 2024 | 2024 | 1382 | 2026-08-19T14:11:27.256Z |
| 3 | 12 | 1381 | 2024 | 2024 | 1381 | 2026-08-19T14:12:05.310Z |
| 4 | 14 | 1381 | 2053 | 2053 | 1381 | 2026-08-19T14:12:56.212Z |
| 5 | 10 | 1382 | 2030 | 2030 | 1382 | 2026-08-19T14:13:53.819Z |

#### angular

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 105 | 3772 | 4469 | 4469 | 3772 | 2026-08-19T14:21:20.085Z |
| 2 | 95 | 3818 | 4513 | 4513 | 3818 | 2026-08-19T14:22:00.889Z |
| 3 | 88 | 3789 | 4483 | 4483 | 3789 | 2026-08-19T14:22:56.023Z |
| 4 | 86 | 3824 | 4523 | 4523 | 3824 | 2026-08-19T14:23:55.982Z |
| 5 | 96 | 3773 | 4469 | 4469 | 3773 | 2026-08-19T14:25:00.934Z |

#### next

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 32 | 1387 | 2346 | 2496 | 1387 | 2026-08-19T14:32:03.020Z |
| 2 | 46 | 1385 | 2356 | 2506 | 1385 | 2026-08-19T14:32:59.831Z |
| 3 | 47 | 1383 | 2503 | 2503 | 1383 | 2026-08-19T14:33:40.072Z |
| 4 | 29 | 1382 | 2561 | 2561 | 1382 | 2026-08-19T14:34:35.129Z |
| 5 | 33 | 1383 | 2567 | 2567 | 1383 | 2026-08-19T14:35:21.279Z |

#### nuxt

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 45 | 2707 | 3261 | 3285 | 2707 | 2026-08-19T14:42:08.441Z |
| 2 | 93 | 2784 | 3433 | 3433 | 2784 | 2026-08-19T14:43:17.165Z |
| 3 | 26 | 2706 | 2856 | 3191 | 2706 | 2026-08-19T14:43:56.066Z |
| 4 | 28 | 2704 | 2854 | 3219 | 2704 | 2026-08-19T14:44:56.682Z |
| 5 | 21 | 2704 | 2854 | 3179 | 2704 | 2026-08-19T14:45:48.654Z |

#### react

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0 | 1804 | 2118 | 2118 | 1804 | 2026-08-19T14:53:32.984Z |
| 2 | 0 | 1804 | 1804 | 1804 | 1804 | 2026-08-19T14:54:16.037Z |
| 3 | 0 | 1803 | 2117 | 2117 | 1803 | 2026-08-19T14:55:10.728Z |
| 4 | 0 | 1802 | 2114 | 2114 | 1802 | 2026-08-19T14:55:54.299Z |
| 5 | 0 | 1804 | 2119 | 2119 | 1804 | 2026-08-19T14:56:44.317Z |

## 5. Memory — wszystkie powtórzenia

Scenariusz: `/?limit=1000`, used JS heap po GC.

| Framework | n | mediana (MB) | surowe (MB) | surowe (B) |
|---|---:|---:|---|---|
| vue | 5 | 24.82 | 24.82; 24.82; 24.84; 24.82; 24.84 | 26022636; 26022280; 26045904; 26021088; 26045988 |
| svelte | 5 | 16.2 | 16.20; 16.20; 16.21; 16.20; 16.21 | 16989408; 16989660; 16992544; 16991744; 16992464 |
| angular | 5 | 19.73 | 19.73; 19.73; 19.73; 19.73; 19.73 | 20692260; 20688796; 20691456; 20689068; 20687784 |
| next | 5 | 10.15 | 10.15; 10.16; 10.15; 10.15; 10.15 | 10644388; 10648292; 10639936; 10645712; 10645636 |
| nuxt | 5 | 41.75 | 41.66; 41.76; 41.75; 41.75; 41.75 | 43686568; 43789844; 43778000; 43775064; 43775168 |
| react | 5 | 12.73 | 12.73; 12.73; 12.73; 12.73; 12.73 | 13344572; 13344536; 13344020; 13344004; 13343892 |

Next: 5× ~10.15 MB (jednomodalny). Svelte: 5× ~16.2 MB, 1000 kart.

### 5.1. Próby memory (heap, DOM, karty)

#### vue (`http://localhost:4174/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 26022636 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26022636 → 26022636 |
| 2 | 26022280 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26022280 → 26022280 |
| 3 | 26045904 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26045904 → 26045904 |
| 4 | 26021088 | 24.82 | 26488832 | 1000 | 22084 | 3010 | 1 | 26021088 → 26021088 |
| 5 | 26045988 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26045988 → 26045988 |

#### svelte (`http://localhost:4175/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 16989408 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16989408 → 16989408 |
| 2 | 16989660 | 16.20 | 18087936 | 1000 | 37245 | 5 | 2 | 16989660 → 16989660 |
| 3 | 16992544 | 16.21 | 17825792 | 1000 | 37245 | 5 | 2 | 16992544 → 16992544 |
| 4 | 16991744 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16991744 → 16991744 |
| 5 | 16992464 | 16.21 | 17563648 | 1000 | 37245 | 5 | 2 | 16992464 → 16992464 |

#### angular (`http://localhost:4500/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 20692260 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20692260 → 20692260 |
| 2 | 20688796 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20688796 → 20688796 |
| 3 | 20691456 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20691456 → 20691456 |
| 4 | 20689068 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20689068 → 20689068 |
| 5 | 20687784 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20687784 → 20687784 |

#### next (`http://localhost:4300/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 10644388 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10644388 → 10644388 |
| 2 | 10648292 | 10.16 | 11272192 | 1000 | 19093 | 5306 | 1 | 10648292 → 10648292 |
| 3 | 10639936 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10639936 → 10639936 |
| 4 | 10645712 | 10.15 | 11010048 | 1000 | 19093 | 5306 | 1 | 10645712 → 10645712 |
| 5 | 10645636 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10645636 → 10645636 |

#### nuxt (`http://localhost:4400/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 43686568 | 41.66 | 44314624 | 1000 | 22100 | 3011 | 1 | 43686568 → 43686568 |
| 2 | 43789844 | 41.76 | 44576768 | 1000 | 22100 | 3011 | 1 | 43789844 → 43789844 |
| 3 | 43778000 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43778000 → 43778000 |
| 4 | 43775064 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43775064 → 43775064 |
| 5 | 43775168 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43775168 → 43775168 |

#### react (`http://localhost:4173/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 13344572 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13344572 → 13344572 |
| 2 | 13344536 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344536 → 13344536 |
| 3 | 13344020 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344020 → 13344020 |
| 4 | 13344004 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344004 → 13344004 |
| 5 | 13343892 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13343892 → 13343892 |

## 6. Bundle (initial load `/`)

Definicja: gzip-9 lokalnych JS/CSS z HTML `/` (`script`, `stylesheet`, `modulepreload`). `distDump` = walk katalogu dist (diagnostyka, nie metryka PROMETHEE).

| Framework | gzip (B) | gzip (KB) | raw (B) | plików | stable | distDump gzip (B / plików) |
|---|---:|---:|---:|---:|---|---|
| vue | 41824 | 40.8 | 119915 | 2 | tak | 61725 / 9 |
| svelte | 41344 | 40.4 | 133907 | 2 | tak | 41344 / 2 |
| angular | 114795 | 112.1 | 390367 | 2 | tak | 114795 / 2 |
| next | 183331 | 179.0 | 604042 | 9 | tak | 195243 / 19 |
| nuxt | 85294 | 83.3 | 227405 | 12 | tak | 116690 / 28 |
| react | 93984 | 91.8 | 313954 | 2 | tak | 93984 / 2 |

Dla każdego z 6: `valueGzipBytes == build1.gzipBytes == build2.gzipBytes` i ta sama lista URL.

### vue

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-HycXeBU5.js` | 100814 | 37836 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

### svelte

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-C1cdMGIZ.js` | 114806 | 37356 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

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

## 7. Porty i czasy bloku per framework

| Framework | port | origin | startedAt | finishedAt |
|---|---:|---|---|---|
| vue | 4174 | http://localhost:4174 | 2026-08-19T13:59:55.070Z | 2026-08-19T14:07:47.983Z |
| svelte | 4175 | http://localhost:4175 | 2026-08-19T14:10:25.001Z | 2026-08-19T14:18:16.310Z |
| angular | 4500 | http://localhost:4500 | 2026-08-19T14:21:01.327Z | 2026-08-19T14:29:04.444Z |
| next | 4300 | http://localhost:4300 | 2026-08-19T14:31:48.447Z | 2026-08-19T14:39:39.247Z |
| nuxt | 4400 | http://localhost:4400 | 2026-08-19T14:42:02.250Z | 2026-08-19T14:50:30.826Z |
| react | 4173 | http://localhost:4173 | 2026-08-19T14:53:27.835Z | 2026-08-19T15:01:31.820Z |

## 8. Uwagi metodyczne do tej serii

1. Druga seria **6/6 OK** (po `12-22-44Z`) z potwierdzoną wersją Chrome, `buildStability` = initial load, Svelte 1000 kart, Next memory jednomodalny.
2. Bundle identyczny z `12-22-44Z` (Svelte 41344 B, pozostałe bez zmian). TBT: Vue mediana 23 (wcześniej 18) — surowa 95 ms w rep 1; Nuxt 28 vs 27.5, z odstającą 93 ms; Angular 95 vs 91, tym razem ciaśniej (86–105); Next 33 vs 41; Svelte 12 vs 14; React znowu 5× 0.
3. Memory mediany te same w granicach 0.01 MB względem `12-22-44Z`.
4. Pełne obiekty CDP `Performance.getMetrics` i raporty LHR są w `raw/run_2026-08-19T13-54-49Z/` (nie powielane tutaj).

