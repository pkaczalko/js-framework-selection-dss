# Svelte — zamrożone wersje

Data instalacji: **2026-08-15**

## Środowisko

| Narzędzie | Wersja |
|---|---|
| Node.js | v24.15.0 |
| npm | 11.12.1 |

## Zależności produkcyjne

| Pakiet | Wersja |
|---|---|
| marked | 18.0.9 |

## Zależności deweloperskie (kluczowe)

| Pakiet | Wersja |
|---|---|
| svelte | 5.56.9 |
| vite | 8.2.1 |
| @sveltejs/vite-plugin-svelte | 7.3.0 |
| typescript | 6.0.3 |
| svelte-check | 4.7.6 |

## Generator

- `npm create vite@latest svelte -- --template svelte-ts`
- Dodatkowo: `npm install marked@18.0.9`
- **Brak zewnętrznego routera** — własny moduł history-mode (`src/lib/router.svelte.ts`)

## Uwagi

- Zainstalowana wersja Svelte: **5.56.9** (rozwiązanie npm z dnia instalacji).
- Routing: własny router na History API; bez `svelte-spa-router` i bez SvelteKit.
