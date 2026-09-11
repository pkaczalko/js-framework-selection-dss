
export const CANONICAL_N20_RUNS = [
  'run_2026-08-19T12-22-44Z',
  'run_2026-08-19T13-54-49Z',
  'run_2026-08-19T16-04-43Z',
  'run_2026-08-19T17-43-28Z',
];


export const REMOVED_INCOMPLETE_RUNS = [
  { id: 'run_2026-08-19T10-45-08Z', reason: '5/6 OK — Svelte FAILED' },
  { id: 'run_2026-08-19T20-14-15Z', reason: '4/6 OK — brak Nuxt i Svelte' },
];


export const EXCLUDED_RUNS = REMOVED_INCOMPLETE_RUNS.map((r) => r.id);
