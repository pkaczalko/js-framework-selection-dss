# Indeks `bench/results/` — wyniki pomiarów

Instrukcja uruchomienia harnessu: [`../README.md`](../README.md).

**Zasada:** do zbioru wyników wchodzą wyłącznie serie kompletne (6/6 frameworków).
Serie niepełne zostały odrzucone i są odnotowane w `canonical-runs.mjs`.

Raporty serii zachowano w postaci, w jakiej powstały w trakcie pomiarów. Odwołania w ich
treści do katalogów `raw/` i `logs/`, do raportów roboczych (`report_*`) oraz do specyfikacji
protokołu (oznaczenia paragrafów) wskazują materiały niedystrybuowane razem z kodem. Surowe
raporty Lighthouse opisuje `raw-manifest.md`, a specyfikacja protokołu wchodzi w skład pracy
magisterskiej. Skrypty `extract-limit1000.mjs` i `generate-podsumowanie-limit1000.mjs`
odtwarzają raport roboczy dla pojedynczej serii, jeśli zajdzie potrzeba ponownej ekstrakcji.

---

## Struktura

```
results/
├── index.md                              ← ten plik
├── summary.json                          ostatnia seria klasy A (mediany + metadane)
├── summary.csv                           eksport do arkusza Źródła
├── summary_limit1000.json                ostatnia ekstrakcja serii N=1000 (nadpisywana)
│
├── canonical-runs.mjs                    CANONICAL_N20_RUNS + REMOVED_INCOMPLETE_RUNS
├── extract-limit1000.mjs                 ekstrakcja audytów LHR → JSON + raport pojedynczej serii
├── extract-raw-tbt.mjs                   ekstrakcja surowych wartości TBT dla obu scenariuszy
├── generate-podsumowanie-limit1000.mjs   generator podsumowanie_run_*_limit1000.md (4 serie)
│
├── podsumowanie_run_<runId>.md           podsumowanie rozszerzone serii N20
├── podsumowanie_run_<runId>_limit1000.md podsumowanie rozszerzone serii N1000
├── bootup-time_serie_6z6.md              analiza bootup-time (4 serie N20)
├── raw-manifest.md                       rejestr ośmiu serii surowych i ich kompletności
├── raw_metryki_surowe.json               surowe wartości metryk wyekstrahowane z raportów LHR
├── raw_tbt_surowe.json                   surowe wartości TBT dla obu scenariuszy
└── ...
```

Surowe raporty Lighthouse (240 plików) oraz logi przebiegu nie wchodzą do repozytorium
ze względu na rozmiar; ich wykaz znajduje się w `raw-manifest.md`.

---

## Opis typów plików

| Typ | Opis |
|---|---|
| `summary.json` / `.csv` | Zagregowane mediany **ostatniej** serii `run-all`; nadpisywane przy każdym pełnym przebiegu |
| `summary_limit1000.json` | Zagregowane mediany ostatniej serii scenariusza N=1000 |
| `podsumowanie_*.md` | Rozszerzone podsumowanie serii: środowisko, surowe powtórzenia i mediany |
| `bootup-time_serie_6z6.md` | Analiza audytu bootup-time z czterech serii N=20 |
| `raw-manifest.md` | Rejestr ośmiu serii surowych: typ, ścieżka pomiaru, profil, liczba raportów, kolejność |
| `raw_metryki_surowe.json` | Ekstrakcja surowych wartości wszystkich metryk z raportów Lighthouse |
| `raw_tbt_surowe.json` | Ekstrakcja surowych wartości TBT dla obu scenariuszy |

---

## Który plik czytać?

| Pytanie | Plik |
|---|---|
| Mediany bundle/TBT/memory do macierzy PROMETHEE? | `summary.json` lub `podsumowanie_run_2026-08-19T17-43-28Z.md` |
| Surowe raporty Lighthouse do własnej ekstrakcji audytów? | `raw/run_<id>/lighthouse/` (poza repozytorium — wykaz w `raw-manifest.md`) |
| Surowe wartości metryk scenariusza N=1000 (LCP, CLS, TBT)? | `podsumowanie_run_<id>_limit1000.md`, sekcja 5 |
| Podsumowanie wszystkich czterech serii N=1000? | `node bench/results/generate-podsumowanie-limit1000.mjs` |
| Ponowna ekstrakcja danych z raportów Lighthouse? | `extract-limit1000.mjs`, `extract-raw-tbt.mjs` |
| Lista serii kanonicznych N=20 w kodzie? | `canonical-runs.mjs` |
| Bootup-time per seria N=20? | `bootup-time_serie_6z6.md` |
