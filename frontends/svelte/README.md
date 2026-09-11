# Conduit — Svelte 5 (RealWorld)

Implementacja frontendu [RealWorld](https://github.com/gothinkster/realworld) ("Conduit") w Svelte 5 + TypeScript + Vite (CSR/SPA), zgodna z kontraktem pracy magisterskiej (PROMETHEE II).

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
VITE_API_URL=http://localhost:3000/api
```

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

## Podgląd produkcyjny (port 4175)

```bash
npm run preview
```

Aplikacja dostępna pod `http://localhost:4175`. Vite preview ma wbudowany fallback SPA (history mode).

## Router

**Custom history-mode router** w `src/lib/router.svelte.ts` — bez zewnętrznej biblioteki routingu. Używa History API (`pushState`/`popstate`), obsługuje guardy tras i query params. Komponent `RouterLink.svelte` zapewnia nawigację bez przeładowania strony.

## Scenariusz pamięciowy (feed 20 artykułów)

Strona główna obsługuje opcjonalny, nieudokumentowany w UI parametr query `limit`:

```
http://localhost:4175/?limit=20
```

Domyślnie `limit=10` (paginacja zgodna ze wzorcem Conduit). Parametr służy wyłącznie protokołowi pomiarowemu pamięci.

## Testy Postman / Newman

**Do wykonania przez użytkownika lokalnie** (wymaga uruchomionego backendu):

```bash
npx newman run <ścieżka>/Conduit.postman_collection.json --global-var "APIURL=http://localhost:3000/api" --global-var "USERNAME=u$(losowe)" --global-var "EMAIL=u@x.io" --global-var "PASSWORD=pass"
```

## Weryfikacja kontraktu (9 punktów)

Przetestuj na buildzie produkcyjnym (`npm run build && npm run preview`, port **4175**), z backendem RealWorld:

1. **JWT auth** — `/register`, `/login`, wylogowanie w `/settings`; token w `localStorage` (`jwt`); nagłówek `Authorization: Token <jwt>`.
2. **Ustawienia** — `/settings`: edycja image, username, bio, email, password.
3. **Feedy** — `/`: Global Feed, Your Feed (po zalogowaniu), paginacja 10/stronę; opcjonalnie `/?limit=20`.
4. **CRUD artykułów** — `/editor`, `/editor/:slug`, usuwanie z widoku artykułu; treść Markdown renderowana przez `marked` (bez sanitizera).
5. **Komentarze** — lista, dodawanie (zalogowany), usuwanie własnych.
6. **Tagi** — sidebar „Popular Tags”, filtrowanie feedu po tagu.
7. **Profile + follow** — `/profile/:username`, follow/unfollow.
8. **Ulubione** — favorite/unfavorite z licznikiem; zakładki My Articles / Favorited Articles (`/profile/:username/favorites`).
9. **Routing history-mode** — wszystkie 9 tras bez `#`; guardy: `/settings`, `/editor*` → `/login` (gość); `/login`, `/register` → `/` (zalogowany).

## Ograniczenia

- Markdown renderowany przez `marked` **bez sanitizera HTML** (identycznie we wszystkich 6 implementacjach; przyrząd pomiarowy, nie produkcja).

## Punkt odniesienia

Implementacja Vue w `frontends/vue/` (analogiczna struktura komponentów i warstwy API). Oficjalna specyfikacja: [RealWorld](https://github.com/gothinkster/realworld).
