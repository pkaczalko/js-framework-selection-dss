# Backend — zamrożone wersje

Data instalacji: **2026-08-15** (implementacja 2026-08-16)

## Środowisko hosta

| Narzędzie | Wersja |
|---|---|
| Node.js (skrypty seed/newman) | v24.15.0 |
| npm | 11.12.1 |
| Docker | 29.1.2 |

## API (vendor)

| Pole | Wartość |
|---|---|
| Źródło | https://github.com/gothinkster/node-express-prisma-v1-official-app |
| Branch | `main` (nie `limited`) |
| Commit | `6ac99ea5aeadc4e001dd4d6933c2e269f878a969` (2022-01-20) |
| Runtime w kontenerze | `node:16.16.0-bullseye-slim` (Prisma 2.29; Node ≥16.17 / 20 / 24 psuje JSON silnika) |
| Postgres | `postgres:16-alpine` |

## Testy kontraktu

| Pole | Wartość |
|---|---|
| Kolekcja Newman | `tests/Conduit.postman_collection.json` |
| Źródło kolekcji | https://github.com/realworld-apps/realworld |
| Commit kolekcji | `5cd08ae2` (`api/Conduit.postman_collection.json`) |

## Uwagi

- Prisma **2.29.1** (lockfile vendora) — obraz Bullseye dla OpenSSL 1.1.
- Pliki `vendor/official-api/src` pozostają niezmienione; poprawki nakłada warstwa `backend/patches/`.
- Newman (czysta baza, 2026-08-16): 86 requestów, 490 asercji, 0 fail.
