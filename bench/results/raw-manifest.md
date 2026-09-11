# Manifest serii pomiarowych

W repozytorium udostępniono wyniki zagregowane (mediany, raporty zbiorcze i pliki ekstrakcji).
Pełne raporty Lighthouse pojedynczych powtórzeń (240 plików JSON, 127 MB) nie wchodzą do repozytorium;
poniższa tabela dokumentuje ich kompletność i pochodzenie.

Wszystkie serie wykonano na maszynie laboratoryjnej opisanej w `../README.md`.
Każda seria obejmuje 6 frameworków po 5 powtórzeń, czyli 30 raportów Lighthouse.

| Seria | Typ | Ścieżka pomiaru | Profil | Powtórzeń | Frameworki | Raporty LHR | Commit | Kolejność frameworków |
|---|---|---|---|---:|---:|---:|---|---|
| `run_2026-08-19T12-22-44Z` | klasa A (N20) | `/?limit=20` | mobile | 5 | 6/6 | 30 | `68b4d7d` | nuxt > vue > next > angular > react > svelte |
| `run_2026-08-19T13-54-49Z` | klasa A (N20) | `/?limit=20` | mobile | 5 | 6/6 | 30 | `68b4d7d` | vue > svelte > angular > next > nuxt > react |
| `run_2026-08-19T16-04-43Z` | klasa A (N20) | `/?limit=20` | mobile | 5 | 6/6 | 30 | `68b4d7d` | next > nuxt > react > svelte > vue > angular |
| `run_2026-08-19T17-43-28Z` | klasa A (N20) | `/?limit=20` | mobile | 5 | 6/6 | 30 | `68b4d7d` | angular > next > vue > react > svelte > nuxt |
| `run_2026-08-26T22-21-04Z_limit1000` | pilot N1000 | `/?limit=1000` | mobile | 5 | 6/6 | 30 | `68b4d7d` | svelte > nuxt > react > angular > next > vue |
| `run_2026-08-27T03-11-00Z_limit1000` | pilot N1000 | `/?limit=1000` | mobile | 5 | 6/6 | 30 | `68b4d7d` | angular > next > react > svelte > nuxt > vue |
| `run_2026-08-27T05-52-22Z_limit1000` | pilot N1000 | `/?limit=1000` | mobile | 5 | 6/6 | 30 | `68b4d7d` | vue > svelte > react > nuxt > next > angular |
| `run_2026-08-27T06-46-07Z_limit1000` | pilot N1000 | `/?limit=1000` | mobile | 5 | 6/6 | 30 | `68b4d7d` | next > react > vue > angular > svelte > nuxt |

Suma: 8 serii, 48 kompletów framework × seria, 240 raportów Lighthouse.

Dwie serie niepełne z 19 sierpnia (5/6 — awaria Svelte oraz 4/6 — brak Nuxt i Svelte) zostały
odrzucone i nie wchodzą do zbioru wyników. Ich identyfikatory i powody są zapisane
w `canonical-runs.mjs`.

Commit `68b4d7d` to stan kodu, na którym wykonano wszystkie pomiary.
