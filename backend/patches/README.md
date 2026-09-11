# Patche nakładane w Dockerfile na oficjalne źródła (vendor bez zmian)

Oficjalny kod z 2022 ma kilka crashy Prisma/Node, które psują kontrakt RealWorld
dla 6 frontendów. Nakładamy overlay **w obrazie**, nie ruszamy `vendor/`.

## empty-or (Prisma 2.29 + PostgreSQL)

Oficjalny kod buduje `author: { OR: [], AND: [] }` gdy request jest anonimowy.
Puste `OR`/`AND` w Prisma 2 na Postgresie rzuca błąd → HTTP 500 na `GET /api/tags` i `GET /api/articles`.

- `tag.service.ts` — `groupBy` bez pustego `OR`
- `article.service.ts` — `buildFindAllQuery` i komentarze: filtr tylko gdy są warunki

## optional-password / optional-tagList

- `auth.service.ts` — `PUT /user` bez `password` (Newman i Settings) nie woła `bcrypt.hash(undefined)`
- `article.service.ts` — `POST /articles` bez `tagList` (dozwolone w spec) nie woła `.map` na `undefined`

## 404/403 zamiast 500 Prisma

Brakujący slug i update/delete cudzego artykułu: `HttpException` 404/403 z `{ errors }`,
zamiast crasha query engine. `deleteArticle` dostaje `username` (kontroler).

## kody 201

Kolekcja Newman (realworld-apps) oczekuje 201 przy tworzeniu artykułu i komentarza.
Oficjalny kontroler zwracał 200. Overlay: `res.status(201)` — `fetch().ok` frontendów bez zmian.

## kody i koperty błędów (Newman)

Kolekcja realworld-apps jest nowsza niż API z 2022. Overlay wyrównuje kopertę `{ errors }`
i kody (201 create, 401 bez tokena, 409 duplikat, 403 forbidden), bez zmiany happy-path JSON
dla frontendów.
