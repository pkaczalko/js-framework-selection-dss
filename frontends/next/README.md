# Conduit — Next.js (RealWorld)

Implementacja frontendu [RealWorld](https://github.com/gothinkster/realworld) („Conduit”) w Next.js 16 + App Router (SSR/hydration). Część pracy magisterskiej porównującej frameworki JS metodą PROMETHEE II.

## Wymagania

- Node.js **v24.15.0**
- npm **11.12.1**
- Działający backend RealWorld (domyślnie lokalny `node-express-realworld-example-app` na porcie 3000)

## Instalacja

```powershell
cd frontends/next
npm install
```

Skopiuj plik środowiskowy i ustaw adres API:

```powershell
copy .env.example .env
```

Domyślna wartość: `NEXT_PUBLIC_API_URL=http://localhost:3000/api`

## Uruchomienie deweloperskie

```powershell
npm run dev
```

## Build produkcyjny

```powershell
npm run build
```

## Serwer produkcyjny (port 4300)

Backend RealWorld domyślnie nasłuchuje na `:3000`; frontend prod uruchamiamy na **4300**:

```powershell
npm run start -- -p 4300
```

Aplikacja dostępna pod adresem **http://localhost:4300/**.

## Scenariusz pomiaru pamięci (feed 20 artykułów)

Strona główna odczytuje opcjonalny, niewidoczny w UI parametr query `limit` (domyślnie 10):

```
http://localhost:4300/?limit=20
```

Wymaga co najmniej 20 artykułów w backendzie (np. seed użytkownika testowego). Parametr nie zmienia domyślnego zachowania aplikacji (`limit=10`).

## Ograniczenie bezpieczeństwa

Treść artykułów renderowana jest przez `marked`, bez sanitizera HTML. Rozwiązanie jest identyczne we wszystkich sześciu implementacjach, co utrzymuje porównywalność pomiarów.

## Weryfikacja kontraktu (9 punktów)

Uruchom backend (`http://localhost:3000/api`) i serwer prod (`npm run start -- -p 4300`). W buildzie produkcyjnym sprawdź każdy punkt — bez błędów w konsoli przeglądarki.

1. **JWT auth** — `/register`: utwórz konto → przekierowanie na `/`. Navbar pokazuje profil. `/login`: wyloguj (Settings → „Or click here to logout”), zaloguj istniejącym kontem. Token w `localStorage` pod kluczem `jwt`. Odśwież stronę — sesja utrzymana.
2. **Settings** — `/settings`: zmień image, username, bio, email, hasło → „Update Settings” → profil zaktualizowany.
3. **Feedy** — `/`: Global Feed z paginacją (10/stronę). Zalogowany: zakładka „Your Feed” (`GET /articles/feed`). Filtr tagiem z sidebaru.
4. **CRUD artykułów** — `/editor`: utwórz artykuł z Markdown → widok `/article/:slug` z renderowanym HTML. `/editor/:slug`: edycja. Usuń artykuł (edytor lub widok artykułu).
5. **Komentarze** — na stronie artykułu: dodaj komentarz (zalogowany), usuń własny (ikona kosza).
6. **Tagi** — sidebar „Popular Tags” na `/`; klik tag filtruje feed.
7. **Profile + follow** — `/profile/:username`: bio, lista artykułów. Zalogowany jako inny user: Follow / Unfollow.
8. **Ulubione** — na liście/widoku artykułu: favorite (serduszko + licznik). Profil → zakładka „Favorited Articles” (`/profile/:username/favorites`).
9. **Routing + guardy** — wszystkie trasy działają: `/`, `/login`, `/register`, `/settings`, `/editor`, `/editor/:slug`, `/article/:slug`, `/profile/:username`, `/profile/:username/favorites`. Gość na `/settings` lub `/editor*` → redirect `/login`. Zalogowany na `/login` lub `/register` → redirect `/`.

## Testy Postman (Newman)

**Do wykonania przez użytkownika lokalnie** (wymaga uruchomionego backendu):

```powershell
npx newman run <ścieżka-do-repo>/Conduit.postman_collection.json --global-var "APIURL=http://localhost:3000/api" --global-var "USERNAME=u$(Get-Random)" --global-var "EMAIL=u@x.io" --global-var "PASSWORD=pass"
```

Kolekcja Postman: repozytorium [gothinkster/realworld](https://github.com/gothinkster/realworld) lub backend `node-express-realworld-example-app`.

## Punkt odniesienia

Struktura komponentów i warstwy API wzorowana na implementacji React RealWorld ([gothinkster/react-redux-realworld-example-app](https://github.com/gothinkster/react-redux-realworld-example-app)) oraz referencyjnym `frontends/react/` w tym repozytorium — **bez** Redux/axios. Routing: App Router (history mode), stan: `AuthContext` + hooks, auth w `localStorage` po hydracji.

## Wersje zależności

Szczegóły w [`VERSION.md`](./VERSION.md).
