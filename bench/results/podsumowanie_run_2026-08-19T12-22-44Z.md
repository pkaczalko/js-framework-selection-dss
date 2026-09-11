# Podsumowanie serii pomiarowej klasy A

**runId:** `2026-08-19T12-22-44Z`  
**Status:** 6/6 OK  
**Źródło:** pomiar własny  
**Start:** 2026-08-19T12:22:46.069Z  
**Koniec (raport):** 2026-08-19T13:26:00.204Z  
**Czas przebiegu:** ~63 min (12:22:46Z → 13:26:00Z)

Skrót orkiestratora: `bench/results/report_2026-08-19T12-22-44Z.md`. Surowe JSON: `bench/results/raw/run_2026-08-19T12-22-44Z/`. Log: `bench/logs/run_2026-08-19T12-22-44Z.log`. CSV: `bench/results/summary.csv`.

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

Uwaga: SHA w metadanych to commit HEAD; poprawka wyścigu Svelte (`router.svelte.ts`, `HomeView.svelte`) była w working tree i weszła do builda Svelte (chunk `index-C1cdMGIZ.js`, 41344 B — wcześniej 41292 B).

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
| Kolejność | wylosowana raz: **nuxt → vue → next → angular → react → svelte** |

## 3. Mediany do PROMETHEE II (kierunek MIN)

| Framework | Status | bundle (B gzip) | bundle (KB) | TBT (ms) | memory (B) | memory (MB) |
|---|---|---:|---:|---:|---:|---:|
| nuxt | OK | 85294 | 83.3 | 27.5 | 43774280 | 41.75 |
| vue | OK | 41824 | 40.8 | 18 | 26019456 | 24.81 |
| next | OK | 183331 | 179.0 | 41 | 10644020 | 10.15 |
| angular | OK | 114795 | 112.1 | 91 | 20692020 | 19.73 |
| react | OK | 93984 | 91.8 | 0 | 13343996 | 12.73 |
| svelte | OK | 41344 | 40.4 | 14 | 16991620 | 16.2 |

Ranking MIN:
- **bundle:** 1. svelte (41344 B / 40.4 KB); 2. vue (41824 B / 40.8 KB); 3. nuxt (85294 B / 83.3 KB); 4. react (93984 B / 91.8 KB); 5. angular (114795 B / 112.1 KB); 6. next (183331 B / 179.0 KB)
- **tbt:** 1. react (0 ms); 2. svelte (14 ms); 3. vue (18 ms); 4. nuxt (27.5 ms); 5. next (41 ms); 6. angular (91 ms)
- **memory:** 1. next (10.15 MB); 2. react (12.73 MB); 3. svelte (16.2 MB); 4. angular (19.73 MB); 5. vue (24.81 MB); 6. nuxt (41.75 MB)

## 4. TBT — wszystkie powtórzenia

Scenariusz: `/?limit=20`, form-factor mobile.

| Framework | n | mediana | min | max | surowe (ms) | FCP med. (ms) | TTI med. (ms) |
|---|---:|---:|---:|---:|---|---:|---:|
| nuxt | 5 | 27.5 | 24.5 | 32.5 | 24.5; 29.5; 27.5; 32.5; 26.5 | 2706 | 3215 |
| vue | 5 | 18 | 14 | 22 | 22; 18; 18; 16; 14 | 1503 | 2024 |
| next | 5 | 41 | 32 | 52 | 40; 32; 41; 52; 43 | 1383 | 2571 |
| angular | 5 | 91 | 43 | 152 | 88; 43; 91; 152; 111 | 3776 | 4403 |
| react | 5 | 0 | 0 | 50 | 0; 0; 50; 0; 0 | 1803 | 2115 |
| svelte | 5 | 14 | 12 | 19 | 12; 17; 19; 14; 14 | 1382 | 2031 |

React TBT = 0 ms (mediana): 4/5 prób = 0, jedna = 50 ms. TBT sumuje tylko (długość − 50 ms) dla tasków > 50 ms między FCP a TTI. Zero przy FCP ≈ 1803 ms i TTI ≈ 2115 ms jest legalne (strona się namalowała).

### 4.1. Próby TBT (FCP / LCP / TTI / Speed Index)

#### nuxt

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 24.5 | 2706 | 2856 | 3214 | 2706 | 2026-08-19T12:24:33.041Z |
| 2 | 29.5 | 2755 | 2905 | 3272 | 2755 | 2026-08-19T12:25:37.733Z |
| 3 | 27.5 | 2706 | 2856 | 3221 | 2706 | 2026-08-19T12:26:21.845Z |
| 4 | 32.5 | 2706 | 2856 | 3159 | 2706 | 2026-08-19T12:27:17.816Z |
| 5 | 26.5 | 2703 | 2853 | 3215 | 2703 | 2026-08-19T12:27:59.814Z |

#### vue

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 22 | 1503 | 2031 | 2031 | 1503 | 2026-08-19T12:35:33.276Z |
| 2 | 18 | 1502 | 2023 | 2023 | 1502 | 2026-08-19T12:36:10.987Z |
| 3 | 18 | 1503 | 2024 | 2024 | 1503 | 2026-08-19T12:37:10.625Z |
| 4 | 16 | 1503 | 2023 | 2023 | 1503 | 2026-08-19T12:38:03.482Z |
| 5 | 14 | 1503 | 2025 | 2025 | 1503 | 2026-08-19T12:38:41.377Z |

#### next

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 40 | 1535 | 2506 | 2506 | 1535 | 2026-08-19T12:45:36.674Z |
| 2 | 32 | 1384 | 2571 | 2571 | 1384 | 2026-08-19T12:46:36.960Z |
| 3 | 41 | 1383 | 2711 | 2711 | 1383 | 2026-08-19T12:47:40.214Z |
| 4 | 52 | 1383 | 2508 | 2508 | 1383 | 2026-08-19T12:48:47.384Z |
| 5 | 43 | 1383 | 2712 | 2712 | 1383 | 2026-08-19T12:49:30.572Z |

#### angular

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 88 | 3711 | 4399 | 4399 | 3711 | 2026-08-19T12:56:24.261Z |
| 2 | 43 | 3869 | 4218 | 4345 | 3869 | 2026-08-19T12:57:13.192Z |
| 3 | 91 | 3824 | 4523 | 4523 | 3824 | 2026-08-19T12:58:18.469Z |
| 4 | 152 | 3713 | 4403 | 4403 | 3713 | 2026-08-19T12:59:04.627Z |
| 5 | 111 | 3776 | 4470 | 4470 | 3776 | 2026-08-19T13:00:08.688Z |

#### react

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0 | 1803 | 2115 | 2115 | 1803 | 2026-08-19T13:08:07.229Z |
| 2 | 0 | 1803 | 2148 | 2148 | 1803 | 2026-08-19T13:08:54.216Z |
| 3 | 50 | 1708 | 2073 | 2073 | 1708 | 2026-08-19T13:09:33.191Z |
| 4 | 0 | 1804 | 2116 | 2116 | 1804 | 2026-08-19T13:10:32.929Z |
| 5 | 0 | 1802 | 2115 | 2115 | 1802 | 2026-08-19T13:11:10.920Z |

#### svelte

| rep | TBT (ms) | FCP (ms) | LCP (ms) | TTI (ms) | SI (ms) | fetchTime |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 12 | 1382 | 1874 | 1874 | 1382 | 2026-08-19T13:18:01.341Z |
| 2 | 17 | 1382 | 2031 | 2031 | 1382 | 2026-08-19T13:18:46.227Z |
| 3 | 19 | 1382 | 2033 | 2033 | 1382 | 2026-08-19T13:19:49.087Z |
| 4 | 14 | 1382 | 2059 | 2059 | 1382 | 2026-08-19T13:20:46.809Z |
| 5 | 14 | 1382 | 2025 | 2025 | 1382 | 2026-08-19T13:21:34.610Z |

## 5. Memory — wszystkie powtórzenia

Scenariusz: `/?limit=1000`, used JS heap po GC.

| Framework | n | mediana (MB) | surowe (MB) | surowe (B) |
|---|---:|---:|---|---|
| nuxt | 5 | 41.75 | 41.75; 41.76; 41.75; 41.75; 41.75 | 43773364; 43786484; 43775036; 43774280; 43772832 |
| vue | 5 | 24.81 | 24.84; 24.81; 24.81; 24.81; 24.84 | 26045404; 26019456; 26019420; 26019016; 26044916 |
| next | 5 | 10.15 | 10.15; 10.15; 10.15; 10.15; 10.14 | 10640416; 10647644; 10645888; 10644020; 10634648 |
| angular | 5 | 19.73 | 19.73; 19.73; 19.73; 19.73; 19.73 | 20693220; 20689736; 20689084; 20692180; 20692020 |
| react | 5 | 12.73 | 12.73; 12.73; 12.70; 12.73; 12.73 | 13344040; 13352144; 13312872; 13343996; 13343992 |
| svelte | 5 | 16.2 | 16.21; 16.21; 16.20; 16.20; 16.20 | 16992960; 16993344; 16991520; 16988632; 16991620 |

Next: 5× ~10.15 MB (brak bimodalu ~15.5 z serii diagnostycznych). Svelte: 5× ~16.2 MB, 1000 kart (wyścig `limit=10` vs `1000` naprawiony).

### 5.1. Próby memory (heap, DOM, karty)

#### nuxt (`http://localhost:4400/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 43773364 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43773364 → 43773364 |
| 2 | 43786484 | 41.76 | 44576768 | 1000 | 22100 | 3011 | 1 | 43786484 → 43786484 |
| 3 | 43775036 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43775036 → 43775036 |
| 4 | 43774280 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43774280 → 43774280 |
| 5 | 43772832 | 41.75 | 44576768 | 1000 | 22100 | 3011 | 1 | 43772832 → 43772832 |

#### vue (`http://localhost:4174/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 26045404 | 24.84 | 26488832 | 1000 | 22084 | 3010 | 1 | 26045404 → 26045404 |
| 2 | 26019456 | 24.81 | 26750976 | 1000 | 22084 | 3010 | 1 | 26019456 → 26019456 |
| 3 | 26019420 | 24.81 | 26488832 | 1000 | 22084 | 3010 | 1 | 26019420 → 26019420 |
| 4 | 26019016 | 24.81 | 26488832 | 1000 | 22084 | 3010 | 1 | 26019016 → 26019016 |
| 5 | 26044916 | 24.84 | 26750976 | 1000 | 22084 | 3010 | 1 | 26044916 → 26044916 |

#### next (`http://localhost:4300/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 10640416 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10640416 → 10640416 |
| 2 | 10647644 | 10.15 | 11272192 | 1000 | 19093 | 5307 | 1 | 10647644 → 10647644 |
| 3 | 10645888 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10645888 → 10645888 |
| 4 | 10644020 | 10.15 | 11272192 | 1000 | 19093 | 5306 | 1 | 10644020 → 10644020 |
| 5 | 10634648 | 10.14 | 11534336 | 1000 | 19093 | 5306 | 1 | 10634648 → 10634648 |

#### angular (`http://localhost:4500/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 20693220 | 19.73 | 21233664 | 1000 | 23096 | 5014 | 1 | 20693220 → 20693220 |
| 2 | 20689736 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20689736 → 20689736 |
| 3 | 20689084 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20689084 → 20689084 |
| 4 | 20692180 | 19.73 | 21495808 | 1000 | 23096 | 5014 | 1 | 20692180 → 20692180 |
| 5 | 20692020 | 19.73 | 20971520 | 1000 | 23096 | 5014 | 1 | 20692020 → 20692020 |

#### react (`http://localhost:4173/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 13344040 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13344040 → 13344040 |
| 2 | 13352144 | 12.73 | 13893632 | 1000 | 19074 | 5149 | 1 | 13352144 → 13352144 |
| 3 | 13312872 | 12.70 | 13631488 | 1000 | 19074 | 5149 | 1 | 13312872 → 13312872 |
| 4 | 13343996 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13343996 → 13343996 |
| 5 | 13343992 | 12.73 | 13631488 | 1000 | 19074 | 5149 | 1 | 13343992 → 13343992 |

#### svelte (`http://localhost:4175/?limit=1000`)

| rep | used (B) | used (MB) | total (B) | karty | DOM nodes | listeners | docs | odczyty GC (B) |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 16992960 | 16.21 | 17825792 | 1000 | 37245 | 5 | 2 | 16992960 → 16992960 |
| 2 | 16993344 | 16.21 | 17825792 | 1000 | 37245 | 5 | 2 | 16993344 → 16993344 |
| 3 | 16991520 | 16.20 | 17563648 | 1000 | 37245 | 5 | 2 | 16991520 → 16991520 |
| 4 | 16988632 | 16.20 | 18087936 | 1000 | 37245 | 5 | 2 | 16988632 → 16988632 |
| 5 | 16991620 | 16.20 | 17825792 | 1000 | 37245 | 5 | 2 | 16991620 → 16991620 |

## 6. Bundle (initial load `/`)

Definicja: gzip-9 lokalnych JS/CSS z HTML `/` (`script`, `stylesheet`, `modulepreload`). `distDump` = walk katalogu dist (diagnostyka, nie metryka PROMETHEE).

| Framework | gzip (B) | gzip (KB) | raw (B) | plików | stable | distDump gzip (B / plików) |
|---|---:|---:|---:|---:|---|---|
| nuxt | 85294 | 83.3 | 227405 | 12 | tak | 116690 / 28 |
| vue | 41824 | 40.8 | 119915 | 2 | tak | 61725 / 9 |
| next | 183331 | 179.0 | 604042 | 9 | tak | 195243 / 19 |
| angular | 114795 | 112.1 | 390367 | 2 | tak | 114795 / 2 |
| react | 93984 | 91.8 | 313954 | 2 | tak | 93984 / 2 |
| svelte | 41344 | 40.4 | 133907 | 2 | tak | 41344 / 2 |

Dla każdego z 6: `valueGzipBytes == build1.gzipBytes == build2.gzipBytes` i ta sama lista URL.

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

### vue

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/assets/index-HycXeBU5.js` | 100814 | 37836 |
| `/assets/index-_BbT5t9z.css` | 19101 | 3988 |

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

### angular

| URL | raw (B) | gzip (B) |
|---|---:|---:|
| `/main-7HG4VLMA.js` | 370337 | 110746 |
| `/styles-V7LOWGDA.css` | 20030 | 4049 |

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

## 7. Porty i czasy bloku per framework

| Framework | port | origin | startedAt | finishedAt |
|---|---:|---|---|---|
| nuxt | 4400 | http://localhost:4400 | 2026-08-19T12:24:26.400Z | 2026-08-19T12:32:34.077Z |
| vue | 4174 | http://localhost:4174 | 2026-08-19T12:35:28.081Z | 2026-08-19T12:43:17.930Z |
| next | 4300 | http://localhost:4300 | 2026-08-19T12:45:30.935Z | 2026-08-19T12:53:38.187Z |
| angular | 4500 | http://localhost:4500 | 2026-08-19T12:56:18.198Z | 2026-08-19T13:05:13.063Z |
| react | 4173 | http://localhost:4173 | 2026-08-19T13:08:02.070Z | 2026-08-19T13:15:44.759Z |
| svelte | 4175 | http://localhost:4175 | 2026-08-19T13:17:55.772Z | 2026-08-19T13:26:00.202Z |

## 8. Uwagi metodyczne do tej serii

1. Pierwsza seria **6/6 OK** z potwierdzoną wersją Chrome, `buildStability` = initial load, Svelte memory 1000 kart, Next memory jednomodalny.
2. Nie mieszać z `run_2026-08-19T06-19-00Z` (Chrome nieznana, inna definicja stability) ani `09-30-11Z` / `10-45-08Z` (Svelte FAILED).
3. Angular TBT ma najszerszy rozrzut (43–152 ms); mediana 91 ms jest formalnie poprawna.
4. Pełne obiekty CDP `Performance.getMetrics` i raporty LHR są w `raw/run_2026-08-19T12-22-44Z/` (nie powielane tutaj).

