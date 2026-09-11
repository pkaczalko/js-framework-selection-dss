# Conduit — Angular (RealWorld)

Implementacja frontendu [RealWorld](https://github.com/gothinkster/realworld) („Conduit”) w Angular 22 (CSR, standalone, zoneless). Część pracy magisterskiej porównującej frameworki JS metodą PROMETHEE II.

## Wymagania

- Node.js **v24.15.0**
- npm **11.12.1**
- Działający backend RealWorld (domyślnie lokalny `node-express-realworld-example-app` na porcie 3000)

## Instalacja

```powershell
cd frontends/angular
npm install
```

## Konfiguracja API_URL

Angular **nie czyta** plików `.env` w runtime. Plik `.env.example` dokumentuje wspólną wartość; rzeczywista konfiguracja jest w:

`src/environments/environment.ts` → pole `apiUrl`

Domyślna wartość: `http://localhost:3000/api`

## Uruchomienie deweloperskie

```powershell
npm start
```

Domyślnie: **http://localhost:4200/**

## Build produkcyjny

```powershell
npm run build
```

Artefakty trafiają do katalogu `dist/angular/browser/`.

## Serwer produkcyjny (port 4500)

```powershell
npm run build
npx --yes http-server dist/angular/browser -p 4500 -P "http://localhost:4500?"
```

Aplikacja dostępna pod adresem **http://localhost:4500/**. Flaga `-P` zapewnia fallback SPA (history mode). `http-server` uruchamiany przez `npx` — **nie** jest zależnością projektu.

## Scenariusz pomiaru pamięci (feed 20 artykułów)

Strona główna odczytuje opcjonalny, niewidoczny w UI parametr query `limit` (domyślnie 10):

```
http://localhost:4500/?limit=20
```

Wymaga co najmniej 20 artykułów w backendzie (np. seed użytkownika testowego). Parametr nie zmienia domyślnego zachowania aplikacji (`limit=10`).

## Ograniczenie bezpieczeństwa

Treść artykułów renderowana jest przez `marked` i wstawiana do widoku przez `DomSanitizer.bypassSecurityTrustHtml`, bez dodatkowego sanitizera. Rozwiązanie jest identyczne we wszystkich sześciu implementacjach, co utrzymuje porównywalność pomiarów.

## Weryfikacja kontraktu (9 punktów)

Uruchom backend (`http://localhost:3000/api`) i serwer prod (port 4500). W buildzie produkcyjnym sprawdź każdy punkt — bez błędów w konsoli przeglądarki.

1. **JWT auth** — `/register`: utwórz konto → przekierowanie na `/`. Navbar pokazuje profil. `/login`: wyloguj (Settings → „Or click here to logout”), zaloguj istniejącym kontem. Token w `localStorage` pod kluczem `jwt`. Odśwież stronę — sesja utrzymana.
2. **Settings** — `/settings`: zmień image, username, bio, email, hasło → „Update Settings” → profil zaktualizowany.
3. **Feedy** — `/`: Global Feed z paginacją (10/stronę). Zalogowany: zakładka „Your Feed” (`GET /articles/feed`). Filtr tagiem z sidebaru.
4. **CRUD artykułów** — `/editor`: utwórz artykuł z Markdown → widok `/article/:slug` z renderowanym HTML. `/editor/:slug`: edycja. Usuń artykuł (edytor lub widok artykułu).
5. **Komentarze** — na stronie artykułu: dodaj komentarz (zalogowany), usuń własny (ikona kosza).
6. **Tagi** — sidebar „Popular Tags” na `/`; klik tag filtruje feed.
7. **Profile + follow** — `/profile/:username`: bio, lista artykułów. Zalogowany jako inny user: Follow / Unfollow.
8. **Ulubione** — na liście/widoku artykułu: favorite (serduszko + licznik, live update na liście). Profil → zakładka „Favorited Articles” (`/profile/:username/favorites`).
9. **Routing + guardy** — wszystkie trasy działają: `/`, `/login`, `/register`, `/settings`, `/editor`, `/editor/:slug`, `/article/:slug`, `/profile/:username`, `/profile/:username/favorites`. Gość na `/settings` lub `/editor*` → redirect `/login`. Zalogowany na `/login` lub `/register` → redirect `/`.

## Testy Postman (Newman)

**Do wykonania przez użytkownika lokalnie** (wymaga uruchomionego backendu):

```powershell
npx newman run <ścieżka-do-repo>/Conduit.postman_collection.json --global-var "APIURL=http://localhost:3000/api" --global-var "USERNAME=u$(Get-Random)" --global-var "EMAIL=u@x.io" --global-var "PASSWORD=pass"
```

Kolekcja Postman: repozytorium [gothinkster/realworld](https://github.com/gothinkster/realworld) lub backend `node-express-realworld-example-app`.

## Punkt odniesienia

Struktura komponentów i warstwy API wzorowana na implementacji React RealWorld ([gothinkster/react-redux-realworld-example-app](https://github.com/gothinkster/react-redux-realworld-example-app)) — idiomatycznie odwzorowana w Angular (signals, DI, HttpClient, functional guards/interceptor).

## Wersje zależności

Szczegóły w [`VERSION.md`](./VERSION.md).
