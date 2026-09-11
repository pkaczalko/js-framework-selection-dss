# Wspólny backend RealWorld (Conduit)

Oficjalne API [node-express-prisma-v1-official-app](https://github.com/gothinkster/node-express-prisma-v1-official-app) (branch `main`), uruchamiane lokalnie dla wszystkich 6 frontendów. **Nie jest obiektem porównania PROMETHEE II.**

Adres zamrożony w frontendach: **`http://localhost:3000/api`**.

Szczegóły wdrożenia i wersje: [`VERSION.md`](./VERSION.md).

## Wymagania

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (daemon uruchomiony)
- Node.js na hoście tylko do skryptów `seed-measure.mjs` i Newman (`npx newman`) — API działa w kontenerze **Node 16.16.0** (Prisma 2.29; nowszy Node psuje query engine)

## Start

```powershell
cd backend
copy .env.example .env   # jeśli jeszcze nie istnieje
docker compose up --build -d
```

Czekaj aż API odpowie:

```powershell
curl http://localhost:3000/api/tags
```

Albo: `.\scripts\reset-db.ps1` (kasuje dane i startuje od zera).

Stop: `docker compose down`  
Kasowanie bazy: `docker compose down -v`

## Seed pomiarowy (1000 artykułów)

```powershell
node .\scripts\seed-measure.mjs
```

Konto: `measure` / `measure@local.test` / `measurepass`.  
Artykuły: `Measure article 01` … `1000`, tag `measure`. Avatar: lokalny smiley Conduit (`/images/smiley-cyrus.jpeg`) — Newman rejestruje userów bez zdjęcia, seed ustawia je przez `PUT /user`. Skrypt jest idempotentny.

Scenariusze frontendów (porty: React 4173, Vue 4174, Svelte 4175, Next 4300, Nuxt 4400, Angular 4500):

- **TBT:** `http://localhost:<port>/?limit=20`
- **memory:** `http://localhost:<port>/?limit=1000`

## Testy Newman

**Do wykonania przy weryfikacji backendu** (kolekcja pinowana w `tests/`):

```powershell
.\scripts\run-newman.ps1
```

Kolekcja: legacy Postman RealWorld (`realworld-apps/realworld@5cd08ae2`, plik `api/Conduit.postman_collection.json`). Aktualny zestaw upstream to Hurl/Bruno; Newman zostaje, bo tak dokumentują README frontendów.

Uruchamiaj na **czystej** bazie (`.\scripts\reset-db.ps1`, potem Newman). Seed `measure` (20 artykułów) zmienia `articlesCount` i ranking tagów — kolekcja tego nie lubi. Po Newmanie: `node .\scripts\seed-measure.mjs` i pomiary frontendów.

## Konfiguracja

| Zmienna | Znaczenie |
|---|---|
| `PORT` | 3000 (nie zmieniać — kontrakt frontendów) |
| `JWT_SECRET` | sekret JWT (lokalny, zamrożony na pomiary) |
| `DATABASE_URL` | Compose ustawia URL do serwisu `db`; `.env` jest dla ewentualnego startu poza Compose |

Źródła API w `vendor/official-api/` — **bez edycji**. Overlay w `patches/` nakładany w Dockerfile (puste OR Prisma, koperta błędów Newman). Szczegóły: `patches/README.md`.

## CORS

Oficjalne API woła `app.use(cors())` (wszystkie originy). Preview frontendów na `:4173`–`:4500` nie wymaga dodatkowej konfiguracji.

## Troubleshooting

| Objaw | Co zrobić |
|---|---|
| `docker` nie widzi demona | Uruchom Docker Desktop, poczekaj aż silnik wstanie |
| Port 3000 zajęty | Zwolnij proces; **nie** zmieniaj portu API |
| Prisma/migrate pada | `docker compose logs api`; pierwszy start bywa wolny (pobieranie obrazów) |
| Newman flaky | Skrypt już ma `--delay-request 500` |
