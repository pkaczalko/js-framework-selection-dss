# Wspólne zasoby UI

- `conduit.css` — kopia `https://github.com/realworld-apps/realworld/blob/main/assets/theme/styles.css` (Conduit Minimal CSS v4), pobrana 2026-08-15.
- Każda implementacja kopiuje ten plik 1:1 do swojego katalogu (np. `src/conduit.css`) i importuje go do builda.
- Fonty/ikony (CDN, identycznie w 6/6):
  - `https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css`
  - `https://fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic`
- `marked` zamrożony: **18.0.9** (`npm install marked@18.0.9`).
