# Lighthouse `bootup-time` — cztery serie 6/6

**Źródło:** surowe LHR `bench/results/raw/run_*/lighthouse/lighthouse_{fw}_rep{1–5}.json`  
**Serie:** `2026-08-19T12-22-44Z`, `2026-08-19T13-54-49Z`, `2026-08-19T16-04-43Z`, `2026-08-19T17-43-28Z`  
**Pokrycie:** 4 × 6 frameworków × 5 powtórzeń = **120/120** plików LHR  
**Scenariusz TBT (ten sam LHR):** `/?limit=20`, profil mobile

To **nie** jest kryterium PROMETHEE (te to bundle / TBT / memory). Audit Lighthouse `bootup-time` to **czas wykonania JavaScript** (parse/compile + evaluate) w milisekundach.

`numericValue` = `sum(scripting + scriptParseCompile)` (Δ ≈ 0 we wszystkich 120 LHR).  
`numericValue` **nie** równa się `sum(items[].total)` — `total` to całkowity CPU na URL (layout/paint/inne).

## 1. Mediany per seria (ms)

Kierunek MIN (niżej = lepiej). Ranking **identyczny** we wszystkich czterech seriach.

| Framework | 12-22-44Z | 13-54-49Z | 16-04-43Z | 17-43-28Z | mediana 4 serii |
|---|---:|---:|---:|---:|---:|
| svelte | 98.8 | 97.6 | 97.5 | 99.2 | **98.2** |
| vue | 116.9 | 128.8 | 116.2 | 118.7 | **117.8** |
| react | 139.2 | 141.8 | 138.4 | 148.2 | **140.5** |
| angular | 227.7 | 232.2 | 225.4 | 225.9 | **226.8** |
| nuxt | 282.0 | 279.0 | 281.1 | 270.6 | **280.1** |
| next | 317.0 | 326.1 | 341.6 | 312.6 | **321.6** |

Ranking MIN: **svelte → vue → react → angular → nuxt → next**. Next ≈ 3.3× Svelte.

## 2. Ranking (mediana serii)

| Rank | Framework | mediana 4 serii (ms) |
|---:|---|---:|
| 1 | svelte | 98.2 |
| 2 | vue | 117.8 |
| 3 | react | 140.5 |
| 4 | angular | 226.8 |
| 5 | nuxt | 280.1 |
| 6 | next | 321.6 |

## 3. Serie szczegółowo

### 3.1. `2026-08-19T12-22-44Z`

| Framework | n | median_ms | mean_ms | min_ms | max_ms | surowe (rep1→rep5) |
|---|---:|---:|---:|---:|---:|---|
| svelte | 5 | 98.8 | 99.3 | 93.9 | 106.2 | 98.8; 99.4; 98.1; 93.9; 106.2 |
| vue | 5 | 116.9 | 117.6 | 114.8 | 121.1 | 116.9; 121.1; 118.8; 116.2; 114.8 |
| react | 5 | 139.2 | 155.1 | 137.0 | 220.1 | 137.0; 137.0; 220.1; 139.2; 142.2 |
| angular | 5 | 227.7 | 244.1 | 225.1 | 289.8 | 227.7; 225.1; 226.1; 289.8; 251.9 |
| nuxt | 5 | 282.0 | 279.2 | 236.2 | 319.4 | 285.1; 282.0; 236.2; 319.4; 273.3 |
| next | 5 | 317.0 | 324.8 | 301.8 | 359.8 | 301.8; 359.8; 310.1; 335.2; 317.0 |

### 3.2. `2026-08-19T13-54-49Z`

| Framework | n | median_ms | mean_ms | min_ms | max_ms | surowe (rep1→rep5) |
|---|---:|---:|---:|---:|---:|---|
| svelte | 5 | 97.6 | 98.0 | 93.6 | 105.1 | 97.6; 105.1; 95.0; 98.8; 93.6 |
| vue | 5 | 128.8 | 131.6 | 122.4 | 144.8 | 144.8; 128.8; 122.4; 133.6; 128.6 |
| react | 5 | 141.8 | 143.9 | 135.7 | 152.9 | 152.9; 135.7; 150.4; 138.9; 141.8 |
| angular | 5 | 232.2 | 232.3 | 223.3 | 248.8 | 248.8; 232.2; 224.3; 223.3; 232.6 |
| nuxt | 5 | 279.0 | 277.8 | 220.1 | 332.3 | 220.1; 332.3; 271.3; 279.0; 286.2 |
| next | 5 | 326.1 | 325.7 | 299.7 | 351.6 | 327.7; 351.6; 323.6; 299.7; 326.1 |

### 3.3. `2026-08-19T16-04-43Z`

| Framework | n | median_ms | mean_ms | min_ms | max_ms | surowe (rep1→rep5) |
|---|---:|---:|---:|---:|---:|---|
| svelte | 5 | 97.5 | 97.2 | 91.2 | 102.3 | 102.3; 91.2; 99.3; 97.5; 95.8 |
| vue | 5 | 116.2 | 117.6 | 113.0 | 123.8 | 116.2; 120.9; 114.2; 123.8; 113.0 |
| react | 5 | 138.4 | 136.9 | 133.5 | 138.9 | 138.6; 138.9; 133.5; 138.4; 135.0 |
| angular | 5 | 225.4 | 230.3 | 223.4 | 239.7 | 237.7; 223.4; 225.4; 225.4; 239.7 |
| nuxt | 5 | 281.1 | 274.7 | 226.6 | 294.6 | 294.6; 277.3; 281.1; 226.6; 293.7 |
| next | 5 | 341.6 | 340.9 | 290.8 | 397.7 | 346.9; 327.3; 397.7; 341.6; 290.8 |

### 3.4. `2026-08-19T17-43-28Z`

| Framework | n | median_ms | mean_ms | min_ms | max_ms | surowe (rep1→rep5) |
|---|---:|---:|---:|---:|---:|---|
| svelte | 5 | 99.2 | 102.0 | 96.4 | 114.1 | 102.2; 96.4; 114.1; 97.9; 99.2 |
| vue | 5 | 118.7 | 119.8 | 117.4 | 125.7 | 118.7; 118.5; 118.8; 125.7; 117.4 |
| react | 5 | 148.2 | 154.6 | 138.7 | 192.0 | 151.0; 192.0; 148.2; 143.1; 138.7 |
| angular | 5 | 225.9 | 223.5 | 218.4 | 229.0 | 226.0; 225.9; 218.4; 218.5; 229.0 |
| nuxt | 5 | 270.6 | 260.4 | 210.7 | 282.0 | 282.0; 270.9; 270.6; 210.7; 267.8 |
| next | 5 | 312.6 | 318.4 | 292.2 | 345.5 | 292.2; 345.2; 345.5; 296.8; 312.6 |

## 4. Top skrypty (rep najbliższy medianie serii)

`total` = Total CPU Time; `scripting` = Script Evaluation; `scriptParseCompile` = Script Parse. Wartości w ms. LHR grupuje drobne URL-e — zwykle 2–4 wiersze, nie 5.

### svelte — chunk `index-C1cdMGIZ.js`

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | `/?limit=20` | 149.1 | 7.0 | 1.9 |
| 12-22-44Z | `assets/index-C1cdMGIZ.js` | 98.3 | 85.0 | 0.6 |
| 12-22-44Z | Unattributable | 94.1 | 4.3 | 0 |
| 13-54-49Z | `/?limit=20` | 148.8 | 7.1 | 1.7 |
| 13-54-49Z | Unattributable | 101.2 | 4.1 | 0 |
| 13-54-49Z | `index-C1cdMGIZ.js` | 97.8 | 84.2 | 0.6 |
| 16-04-43Z | `/?limit=20` | 147.9 | 5.8 | 1.4 |
| 16-04-43Z | `index-C1cdMGIZ.js` | 96.6 | 83.6 | 0.6 |
| 16-04-43Z | Unattributable | 94.4 | 6.0 | 0 |
| 17-43-28Z | `/?limit=20` | 182.6 | 6.5 | 1.8 |
| 17-43-28Z | `assets/index-C1cdMGIZ.js` | 98.2 | 84.9 | 0.7 |
| 17-43-28Z | Unattributable | 82.4 | 5.2 | 0 |

### vue — brak osobnego URL bundla w LHR

Koszt JS siedzi na dokumencie `/?limit=20` + Unattributable.

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | `/?limit=20` | 233.6 | 73.8 | 1.8 |
| 12-22-44Z | Unattributable | 114.0 | 41.3 | 0 |
| 13-54-49Z | `/?limit=20` | 237.8 | 86.2 | 1.6 |
| 13-54-49Z | Unattributable | 112.3 | 41.0 | 0 |
| 16-04-43Z | `/?limit=20` | 221.5 | 73.1 | 1.7 |
| 16-04-43Z | Unattributable | 115.0 | 41.4 | 0 |
| 17-43-28Z | `/?limit=20` | 218.3 | 75.6 | 1.7 |
| 17-43-28Z | Unattributable | 116.8 | 41.5 | 0 |

### react — chunk `index-B-02nqmS.js`

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | `/?limit=20` | 150.7 | 6.6 | 1.8 |
| 12-22-44Z | `assets/index-B-02nqmS.js` | 132.7 | 125.4 | 0.3 |
| 12-22-44Z | Unattributable | 106.9 | 5.1 | 0 |
| 13-54-49Z | `/?limit=20` | 153.5 | 7.1 | 1.9 |
| 13-54-49Z | `index-B-02nqmS.js` | 135.5 | 127.2 | 0.3 |
| 13-54-49Z | Unattributable | 103.9 | 5.3 | 0 |
| 16-04-43Z | `/?limit=20` | 156.9 | 6.2 | 1.6 |
| 16-04-43Z | `index-B-02nqmS.js` | 132.7 | 125.1 | 0.3 |
| 16-04-43Z | Unattributable | 106.0 | 5.1 | 0 |
| 17-43-28Z | `/?limit=20` | 143.5 | 5.8 | 1.6 |
| 17-43-28Z | `assets/index-B-02nqmS.js` | 131.9 | 124.5 | 0.3 |
| 17-43-28Z | Unattributable | 123.5 | 16.0 | 0 |

### angular — `main-7HG4VLMA.js`

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | `main-7HG4VLMA.js` | 229.8 | 209.2 | 0.7 |
| 12-22-44Z | `/?limit=20` | 166.8 | 7.3 | 1.4 |
| 12-22-44Z | Unattributable | 95.5 | 9.1 | 0 |
| 13-54-49Z | `main-7HG4VLMA.js` | 229.5 | 214.0 | 0.5 |
| 13-54-49Z | `/?limit=20` | 168.7 | 8.0 | 1.6 |
| 13-54-49Z | Unattributable | 91.1 | 8.1 | 0 |
| 16-04-43Z | `main-7HG4VLMA.js` | 224.3 | 207.7 | 0.4 |
| 16-04-43Z | `/?limit=20` | 174.4 | 8.2 | 1.7 |
| 16-04-43Z | Unattributable | 89.6 | 7.4 | 0 |
| 17-43-28Z | `main-7HG4VLMA.js` | 224.8 | 208.2 | 0.4 |
| 17-43-28Z | `/?limit=20` | 165.7 | 7.6 | 1.5 |
| 17-43-28Z | Unattributable | 92.9 | 8.2 | 0 |

### nuxt — większość JS w Unattributable

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | Unattributable | 304.5 | 188.1 | 0 |
| 12-22-44Z | `/?limit=20` | 185.7 | 42.3 | 2.6 |
| 12-22-44Z | `_nuxt/B5OXs9Kn.js` | 50.9 | 48.8 | 0.2 |
| 13-54-49Z | Unattributable | 292.6 | 181.3 | 0 |
| 13-54-49Z | `/?limit=20` | 204.3 | 39.0 | 2.3 |
| 13-54-49Z | `B5OXs9Kn.js` | 57.8 | 56.4 | 0 |
| 16-04-43Z | Unattributable | 323.2 | 203.3 | 0 |
| 16-04-43Z | `/?limit=20` | 169.7 | 6.3 | 2.2 |
| 16-04-43Z | `B5OXs9Kn.js` | 71.5 | 69.3 | 0 |
| 17-43-28Z | Unattributable | 297.4 | 176.8 | 0 |
| 17-43-28Z | `/?limit=20` | 212.2 | 41.5 | 2.4 |
| 17-43-28Z | `_nuxt/B5OXs9Kn.js` | 51.8 | 49.9 | 0 |

### next — dwa duże chunki

| Seria | url | total | scripting | scriptParseCompile |
|---|---|---:|---:|---:|
| 12-22-44Z | `09r8cx-jn5loi.js` | 202.4 | 186.6 | 13.9 |
| 12-22-44Z | `/?limit=20` | 162.7 | 10.9 | 4.3 |
| 12-22-44Z | Unattributable | 117.3 | 16.0 | 0 |
| 12-22-44Z | `2hbx0u5pc3csk.js` | 97.5 | 75.8 | 9.6 |
| 13-54-49Z | `/?limit=20` | 170.6 | 10.8 | 4.4 |
| 13-54-49Z | `09r8cx-jn5loi.js` | 131.3 | 112.5 | 14.4 |
| 13-54-49Z | Unattributable | 117.3 | 14.7 | 0 |
| 13-54-49Z | `2hbx0u5pc3csk.js` | 101.6 | 79.7 | 9.1 |
| 13-54-49Z | `310vm2bl3xxpt.js` | 80.8 | 80.1 | 0.5 |
| 16-04-43Z | `09r8cx-jn5loi.js` | 224.0 | 206.3 | 15.9 |
| 16-04-43Z | `/?limit=20` | 178.6 | 10.0 | 4.3 |
| 16-04-43Z | Unattributable | 123.4 | 16.5 | 0 |
| 16-04-43Z | `2hbx0u5pc3csk.js` | 101.0 | 78.5 | 10.1 |
| 17-43-28Z | `09r8cx-jn5loi.js` | 206.7 | 191.8 | 12.8 |
| 17-43-28Z | `/?limit=20` | 159.3 | 8.9 | 4.1 |
| 17-43-28Z | Unattributable | 124.6 | 16.2 | 0 |
| 17-43-28Z | `2hbx0u5pc3csk.js` | 88.9 | 70.2 | 8.6 |

## 5. Uwagi

1. `displayValue` Lighthouse jest zgrubne (`0.1 s` / `0.2 s` / `0.3 s`); liczby w tabelach są z `numericValue`.
2. Parse/compile jest bliski zeru u Svelte/Vue/React/Angular/Nuxt; u Next widać go na dużych chunkach (~9–16 ms).
3. Rozrzut między seriami: Svelte i Angular ciasne (~2–7 ms median); Vue ma jedną serię 128.8 ms; React 148.2 ms w `17-43-28Z`; Next najszerszy (mediany 313–342, surowe do 398 ms).
4. Serie niepełne (`10-45-08Z` Svelte FAILED, `20-14-15Z` urwana) **nie** wchodzą do zestawienia i zostały **usunięte** z `bench/results/raw/` (2026-08-27).
