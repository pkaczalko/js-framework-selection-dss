# thesis-dss - aplikacja referencyjna RealWorld w sześciu technologiach JavaScript

Materiał źródłowy do pracy magisterskiej „Analiza porównawcza i ocena efektywności wiodących
narzędzi JavaScript w kontekście doboru technologii do specyfiki i skali projektu informatycznego”.

Repozytorium zawiera sześć niezależnych implementacji tej samej aplikacji referencyjnej
[RealWorld](https://github.com/gothinkster/realworld) („Conduit”) oraz harness pomiarowy,
z którego pochodzą dane liczbowe wykorzystane w pracy. Porównywane są wyłącznie warstwy
klienckie; backend jest jeden, wspólny i nie wchodzi do oceny.

## Technologie i tryby renderowania

| Katalog | Framework | Wersja | Tryb | Port produkcyjny |
|---|---|---|---|---|
| `frontends/react` | React + react-router | 19.2.8 | CSR/SPA | 4173 |
| `frontends/vue` | Vue + vue-router | 3.5.41 | CSR/SPA | 4174 |
| `frontends/svelte` | Svelte | 5.56.9 | CSR/SPA | 4175 |
| `frontends/next` | Next.js (App Router) | 16.3.1 | SSR z hydratacją | 4300 |
| `frontends/nuxt` | Nuxt | 4.5.2 | SSR z hydratacją | 4400 |
| `frontends/angular` | Angular (standalone, zoneless) | 22.1.2 | CSR | 4500 |

Wersje zależności są zamrożone w plikach `package-lock.json` i zestawione w `VERSION.md`
w katalogu każdej implementacji. Wszystkie aplikacje realizują identyczny kontrakt
funkcjonalny i korzystają z jednego arkusza stylów motywu Conduit.

## Struktura repozytorium

```
frontends/          sześć implementacji aplikacji referencyjnej
backend/            wspólne API RealWorld (Docker Compose) wraz z warstwą poprawek
bench/              harness pomiarowy i zagregowane wyniki
interfejs/          interfejs decyzyjny DSS (kreator doboru technologii)
_shared/            wspólny arkusz stylów motywu Conduit
```

## Uruchomienie

Backend (wymaga Docker Desktop):

```powershell
cd backend
copy .env.example .env
docker compose up --build -d
curl http://localhost:3000/api/tags
node .\scripts\seed-measure.mjs
```

Aplikacja kliencka:

```powershell
cd frontends/<technologia>
npm install
copy .env.example .env
npm run build
```

Polecenie serwujące wersję produkcyjną i port podaje `README.md` w katalogu danej
implementacji. Adres API jest zapisany w kodzie jako wartość zapasowa
(`http://localhost:3000/api`), więc aplikacje działają także bez pliku `.env`.

## Pomiary

Harness `bench/` wykonuje serię pomiarową dla sześciu aplikacji: rozmiar bundle, czas
blokowania głównego wątku oraz pamięć stosu JavaScript. Pomiary prowadzone są na
wersjach produkcyjnych aplikacji, przy stałym profilu urządzenia mobilnego, pięciu
powtórzeniach na metrykę i agregacji medianą. Uruchomienie i wymagania opisuje
[`bench/README.md`](bench/README.md).

Zagregowane wyniki ośmiu serii pomiarowych znajdują się w `bench/results/`. Surowe raporty
Lighthouse (240 plików) nie wchodzą do repozytorium ze względu na rozmiar; ich wykaz i
kompletność dokumentuje `bench/results/raw-manifest.md`.

## Interfejs decyzyjny

Katalog `interfejs/` zawiera kreator, który na podstawie odpowiedzi decydenta wyznacza wagi
kryteriów i prezentuje ranking technologii z wykresem GAIA. Interfejs zbudowano w czystym
TypeScriptcie z Vite i biblioteką Chart.js, bez użycia ocenianych frameworków. Silnik
PROMETHEE II i warstwa danych modelu 14-kryterialnego wchodzą w skład tego katalogu, więc
aplikacja buduje się samodzielnie. Instrukcję uruchomienia i opis struktury zawiera
[`interfejs/README.md`](interfejs/README.md).

## Środowisko pomiarowe

| Element | Wartość |
|---|---|
| System | Windows 10.0.26200 (x64) |
| Procesor | AMD Ryzen 5 7535HS |
| Pamięć | 13,7 GB |
| Node.js / npm | v24.15.0 / 11.12.1 |
| Przeglądarka | Chrome for Testing 152.0.7977.42 |
| Lighthouse | 13.4.1 |
| Backend | oficjalne API RealWorld w kontenerze Node 16.16.0, Prisma 2.29, PostgreSQL 16 |

## Uwagi

Treść artykułów renderowana jest z Markdownu bez sanitizera HTML. Rozwiązanie jest
identyczne we wszystkich sześciu implementacjach, co utrzymuje porównywalność pomiarów;
dane pochodzą wyłącznie z lokalnego seeda pomiarowego.

Motyw `_shared/conduit.css` pochodzi z projektu RealWorld i zachowano jego nagłówek
oraz plik `SOURCE.md` z atrybucją. Katalog `backend/vendor/official-api` zawiera
niezmienione źródła oficjalnego API RealWorld wraz z ich licencją; katalog
`backend/patches` zawiera wyłącznie warstwę poprawek nakładaną w obrazie kontenera.
