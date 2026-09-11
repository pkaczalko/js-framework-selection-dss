# Conduit — Nuxt.js 4 (RealWorld)

Implementacja frontendu [RealWorld](https://github.com/gothinkster/realworld) ("Conduit") w Nuxt 4 + TypeScript, zgodna z kontraktem pracy magisterskiej (PROMETHEE II).

## Wymagania

- Node.js **v24.15.0**
- npm **11.12.1**
- Działający backend RealWorld (domyślnie lokalny na porcie 3000)

## Konfiguracja API

Skopiuj `.env.example` do `.env`:

```bash
cp .env.example .env
```

Domyślna wartość:

```
NUXT_PUBLIC_API_URL=http://localhost:3000/api
```

Odczyt w aplikacji: `runtimeConfig.public.apiUrl` (fallback `http://localhost:3000/api` gdy brak zmiennej).

## Instalacja

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build produkcyjny

```bash
npm run build
```

## Podgląd produkcyjny (port 4400)

```bash
npm run preview
```

Przy pierwszym uruchomieniu Nuxt wyświetla pytanie o telemetrię, które wstrzymuje start
serwera. Ankietę pomija zmienna środowiskowa:

```powershell
$env:NUXT_TELEMETRY_DISABLED=1
npm run preview
```

Równoważnie:

```bash
npx nuxi preview --port 4400
```

lub:

```bash
set NITRO_PORT=4400
node .output/server/index.mjs
```

Aplikacja dostępna pod `http://localhost:4400`. Backend RealWorld domyślnie na `:3000`.

## Scenariusz pamięciowy (feed 20 artykułów)

Strona główna obsługuje opcjonalny, nieudokumentowany w UI parametr query `limit`:

```
http://localhost:4400/?limit=20
```

Domyślnie `limit=10` (paginacja zgodna ze wzorcem Conduit). Parametr służy wyłącznie protokołowi pomiarowemu pamięci.

## Testy Postman / Newman

**Do wykonania przez użytkownika lokalnie** (wymaga uruchomionego backendu):

```bash
npx newman run <ścieżka>/Conduit.postman_collection.json --global-var "APIURL=http://localhost:3000/api" --global-var "USERNAME=u$(losowe)" --global-var "EMAIL=u@x.io" --global-var "PASSWORD=pass"
```

## Weryfikacja kontraktu (9 punktów)

Przetestuj na buildzie produkcyjnym (`npm run build && npm run preview`, port **4400**), z backendem RealWorld:

1. **JWT auth** — `/register`, `/login`, wylogowanie w `/settings`; token w `localStorage` (`jwt`); nagłówek `Authorization: Token <jwt>`.
2. **Ustawienia** — `/settings`: edycja image, username, bio, email, password.
3. **Feedy** — `/`: Global Feed, Your Feed (po zalogowaniu), paginacja 10/stronę; opcjonalnie `/?limit=20`.
4. **CRUD artykułów** — `/editor`, `/editor/:slug`, usuwanie z widoku artykułu; treść Markdown renderowana przez `marked` (bez sanitizera).
5. **Komentarze** — lista, dodawanie (zalogowany), usuwanie własnych.
6. **Tagi** — sidebar „Popular Tags”, filtrowanie feedu po tagu.
7. **Profile + follow** — `/profile/:username`, follow/unfollow.
8. **Ulubione** — favorite/unfavorite z licznikiem; zakładki My Articles / Favorited Articles (`/profile/:username/favorites`).
9. **Routing history-mode** — ścieżki: `/`, `/login`, `/register`, `/settings`, `/editor`, `/editor/:slug`, `/article/:slug`, `/profile/:username`, `/profile/:username/favorites`; guardy auth jak w kontrakcie.

## Punkt odniesienia

Implementacja wzorowana na oficjalnych szablonach HTML RealWorld ([Templates](https://docs.realworld.show/specifications/frontend/templates/)) oraz strukturze komponentów z [vue-realworld-example-app](https://github.com/gothinkster/vue-realworld-example-app) / [react-redux-realworld-example-app](https://github.com/gothinkster/react-redux-realworld-example-app). CSS: lokalna kopia `_shared/conduit.css`.

## Ograniczenia

- Markdown renderowany przez `marked` **bez sanitizera HTML** (identycznie we wszystkich 6 implementacjach; przyrząd pomiarowy, nie produkcja).
- Brak Pinia — stan auth w `useState('auth')` + composable `useAuth()`.
- SSR: publiczne dane (artykuł, profil) mogą być pobierane na serwerze bez tokena; żądania autoryzowane (feed, follow, favorite, komentarze write, settings, editor) — client-side po hydracji.

## Wersje

Szczegóły w [`VERSION.md`](./VERSION.md).
