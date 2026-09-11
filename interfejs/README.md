# Interfejs decyzyjny DSS

Interaktywny kreator doboru technologii JavaScript, opisany w rozdziale 5.
Użytkownik odpowiada na pytania o zespół, wymagania wydajnościowe, indeksowanie treści
i horyzont utrzymania projektu, a interfejs przelicza wagi kryteriów i wyświetla ranking
sześciu technologii wyznaczony metodą PROMETHEE II.

Interfejs korzysta z czystego TypeScriptu, Vite i biblioteki Chart.js.

## Funkcje

Ranking technologii z wartościami przepływu netto φ oraz dekompozycją wkładów kryteriów.
Trzy źródła wag: kreator preferencji decydenta, metoda obiektywna CRITIC oraz metoda
obiektywna MEREC. Przełącznik scenariusza wolumenu danych N20 i N1000. Wykres płaszczyzny
GAIA z osią decyzyjną, wektorami kryteriów i pozycjami alternatyw.

## Wymagania

Node.js w wersji 24 (wersje zależności są zamrożone w `package-lock.json`).

## Uruchomienie

```bash
npm install
npm run dev        # serwer deweloperski, http://localhost:5173
npm run build      # artefakty do katalogu dist
npm run preview    # podgląd zbudowanej wersji
```


## Narzędzia pomocnicze

Skrypty `generate_*.ts`, `capture_r6.js` i `take_screenshots.js` wymagają zainstalowanej
przeglądarki Chrome oraz działającego serwera z sekcji „Uruchomienie”. Ścieżkę binarki
Chrome przyjmują ze zmiennej `CHROME_PATH` (domyślnie standardowa lokalizacja instalacji),
a katalog wynikowy ze zmiennej `FIGURES_DIR` (domyślnie `figures/` w katalogu roboczym).

```bash
npx tsx generate_gaia.ts
npx tsx generate_heatmap.ts
node capture_r6.js
node take_screenshots.js
```

## Uwagi

`npm run build` korzysta z Vite, który transpiluje kod bez kontroli typów. Pełna kontrola
`npx tsc --noEmit` zgłasza trzy błędy w `src/gaia_export.ts` dotyczące modułów `fs`, `url`
i `path` — plik jest skryptem uruchamianym po stronie Node i projekt nie deklaruje zależności
`@types/node`. Błędy nie wpływają na budowanie ani na działanie interfejsu.
