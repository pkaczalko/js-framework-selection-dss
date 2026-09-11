# bench/ — pomiary klasy A (bundle, TBT, memory)

Automatyczny, nienadzorowany protokół pomiarowy dla sześciu frontendów RealWorld.
Wyniki stanowią dane wejściowe macierzy decyzyjnej PROMETHEE II.

## Wymagania przed startem

1. Backend na `http://localhost:3000/api`, zaseedowany **≥1000** artykułami:

   ```powershell
   cd backend; docker compose up -d; node .\scripts\seed-measure.mjs
   ```

2. Chrome for Testing — ścieżka w `bench/ENV.local.json` (pole `CHROME_PATH`)
   albo zmiennej środowiskowej `CHROME_PATH`. Zainstalowana wersja: 152.0.7977.42.
3. Zależności bench: `cd bench; npm install` (lighthouse, chrome-launcher, puppeteer-core).
4. Komputer przygotowany wg checklisty protokołu (świeży restart, zamknięte tło, zasilanie sieciowe).
5. Porty 4173/4174/4175/4300/4400/4500 wolne (preflight sam próbuje zamknąć kolizje).

## Pełny przebieg

```powershell
node bench/run-all.mjs                      # profil mobile (domyślny)
node bench/run-all.mjs --profile=desktop    # profil desktop (preset Lighthouse)
```

Przebieg: preflight (backend ≥1000 artykułów, CHROME_PATH, porty, 2× build każdego
frameworka — weryfikacja stabilności) → losowa kolejność → per framework: serwer prod,
bundle, 5× TBT (Lighthouse, `/?limit=20`), 5× memory (CDP, `/?limit=1000`),
stop serwera → pauzy 30–60 s / 2–3 min → agregacja median.

**Profil Lighthouse** (jeden dla całej serii): `--profile=mobile|desktop`,
env `LIGHTHOUSE_PROFILE` albo pole `LIGHTHOUSE_PROFILE` w `ENV.local.json`; domyślnie
**mobile** (domyślny throttling Lighthouse). Desktop używa oficjalnego presetu
`lighthouse/core/config/desktop-config.js`. Profil serii jest zapisany w `state.json`,
`summary.json` i raporcie; `--resume` z innym profilem zostanie odrzucone.

Awaria jednego frameworka nie przerywa serii (status `FAILED` w podsumowaniu).

## Wznowienie przerwanego przebiegu

```powershell
node bench/run-all.mjs --resume
```

Dokańcza ostatnią serię (po `runId`): frameworki z kompletem 5+5 powtórzeń
w `results/raw/run_<id>/` są pomijane.

## Pojedyncza metryka (debug)

```powershell
node bench/lighthouse/measure.mjs --framework=react --reps=1 --profile=desktop
node bench/memory/measure.mjs --framework=vue --reps=1
node bench/bundle/measure.mjs --framework=angular
```

Jeśli port frameworka jest zajęty, skrypt użyje działającego serwera (po weryfikacji,
że to build prod); w przeciwnym razie sam go uruchomi i zatrzyma.

## Artefakty

| Ścieżka | Zawartość |
|---|---|
| `results/summary.json` | mediany + metadane (środowisko, protokół, kolejność frameworków) |
| `results/summary.csv` | wiersze framework × metryka (bundle, TBT, memory) |
| `results/summary_limit1000.json` | mediany scenariusza N=1000 |
| `results/podsumowanie_<runId>.md` | rozszerzone podsumowanie serii: środowisko, surowe powtórzenia, mediany |
| `results/raw_metryki_surowe.json` | surowe wartości metryk wyekstrahowane z raportów Lighthouse |
| `results/raw-manifest.md` | rejestr ośmiu serii pomiarowych i ich kompletności |

Katalogi `logs/` i `results/raw/` (logi przebiegu oraz 240 surowych raportów Lighthouse)
nie wchodzą do repozytorium ze względu na rozmiar. Zawartość i kompletność serii
dokumentuje `results/raw-manifest.md`; mediany pozostają w `results/summary.json`
oraz w plikach `raw_metryki_surowe.json` i `raw_tbt_surowe.json`.

## Decyzje metodologiczne

Mediana, nie średnia, jest miarą agregacji, ponieważ pojedyncze powtórzenia obciążone
opóźnieniem systemu nie przesuwają wyniku serii. Każde powtórzenie startuje ze świeżym
katalogiem profilu przeglądarki, a pomiar pamięci wykonuje się w osobnej sesji niż pomiar
Lighthouse po to, by nie dziedziczył ustawień emulacji ani stanu renderera.

Pamięć odczytywana jest przez CDP `Performance.getMetrics` (`JSHeapUsedSize`) po wymuszonym
odśmieceniu, bez heap snapshotu, który sam zaburzałby mierzoną wartość. Bundle obejmuje
wyłącznie zasoby wstawiane przez serwer produkcyjny w HTML trasy startowej (`script`,
`stylesheet`, `modulepreload`) i kompresję gzip; zasoby z CDN nie wchodzą do metryki.
Kontrola `buildStability` powtarza tę samą procedurę po dwóch buildach.
