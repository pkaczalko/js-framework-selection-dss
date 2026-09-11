/**
 * promethee.ts — Silnik metody PROMETHEE II + obiektywne wagi CRITIC / MEREC
 * =========================================================================
 * Moduł stanowi rdzeń systemu wspomagania decyzji (DSS) do doboru technologii
 * JavaScript. Jest czystą biblioteką (bez zależności od UI), wielokrotnie
 * używaną zarówno w obliczeniach do pracy magisterskiej, jak i w działającym
 * kreatorze DSS.
 *
 * Źródła metodyczne (zweryfikowane w Crossref):
 *  - PROMETHEE: Brans & Vincke (1985), Management Science 31(6):647-656,
 *      DOI 10.1287/MNSC.31.6.647
 *  - PROMETHEE II/III: Brans, Vincke & Mareschal (1986), EJOR 24(2):228-238,
 *      DOI 10.1016/0377-2217(86)90044-5
 *  - PROMETHEE + GAIA: Brans & Mareschal (1990), DOI 10.1007/978-3-642-75935-2_10
 *  - MEREC: Keshavarz-Ghorabaee et al. (2021), Symmetry 13(4):525,
 *      DOI 10.3390/SYM13040525
 *  - CRITIC: Diakoulaki et al. (1995), Comput. Oper. Res. 22(7):763-770,
 *      DOI 10.1016/0305-0548(94)00059-H ; modyfikacja: Žižović et al. (2020),
 *      DMAME 3(2):149-161, DOI 10.31181/dmame2003149z
 */

// =========================================================================
// 1. Typy danych
// =========================================================================

/** Kierunek optymalizacji kryterium. */
export type CriterionDirection = "max" | "min";

/**
 * Typ uogólnionej funkcji preferencji wg Bransa (typy I–VI).
 *  - USUAL  (I)   : preferencja 0/1, brak progów
 *  - USHAPE (II)  : próg obojętności q
 *  - VSHAPE (III) : próg preferencji p (liniowa do p)
 *  - LEVEL  (IV)  : progi q i p, preferencja schodkowa (0, 0.5, 1)
 *  - LINEAR (V)   : progi q i p (liniowa między q a p) — domyślna dla danych liczbowych
 *  - GAUSSIAN(VI) : próg s (funkcja gaussowska)
 */
export type PreferenceFunctionType =
  | "USUAL"
  | "USHAPE"
  | "VSHAPE"
  | "LEVEL"
  | "LINEAR"
  | "GAUSSIAN";

/** Definicja pojedynczego kryterium. */
export interface Criterion {
  /** Klucz kryterium (np. "bundle_size"). */
  key: string;
  /** Czytelna nazwa. */
  name: string;
  /** Kierunek: czy większa wartość jest lepsza ("max") czy gorsza ("min"). */
  direction: CriterionDirection;
  /** Typ funkcji preferencji PROMETHEE. */
  preference: PreferenceFunctionType;
  /** Próg obojętności q (dla USHAPE, LEVEL, LINEAR). */
  q?: number;
  /** Próg preferencji p (dla VSHAPE, LEVEL, LINEAR). */
  p?: number;
  /** Parametr s (dla GAUSSIAN). */
  s?: number;
}

/**
 * Macierz decyzyjna.
 * `alternatives` — klucze alternatyw (wiersze).
 * `criteria`     — definicje kryteriów (kolumny).
 * `data[i][j]`   — wartość alternatywy i na kryterium j (kolejność zgodna z tablicami).
 */
export interface DecisionMatrix {
  alternatives: string[];
  criteria: Criterion[];
  data: number[][];
}

/** Wynik rankingu PROMETHEE II dla pojedynczej alternatywy. */
export interface PrometheeScore {
  alternative: string;
  phiPlus: number; // przepływ dodatni
  phiMinus: number; // przepływ ujemny
  phiNet: number; // przepływ netto (PROMETHEE II)
  rank: number; // pozycja w rankingu (1 = najlepsza)
}

/** Pełny wynik analizy. */
export interface PrometheeResult {
  scores: PrometheeScore[];
  /** Profile jednokryterialne φ_c (potrzebne do GAIA). Wymiar: [n_alt][n_crit]. */
  unicriterionNetFlows: number[][];
  weights: number[];
}

// =========================================================================
// 2. Pomocnicze funkcje numeryczne
// =========================================================================

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

/** Odchylenie standardowe z próby (n-1) — używane w CRITIC. */
function stdDev(arr: number[]): number {
  const n = arr.length;
  if (n < 2) return 0;
  const m = mean(arr);
  const variance = sum(arr.map((x) => (x - m) ** 2)) / (n - 1);
  return Math.sqrt(variance);
}

/** Współczynnik korelacji Pearsona między dwiema kolumnami. */
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Wyciąga kolumnę j z macierzy. */
function column(data: number[][], j: number): number[] {
  return data.map((row) => row[j]);
}

// =========================================================================
// 3. Funkcje preferencji PROMETHEE (na podstawie różnicy d = g(a) - g(b))
// =========================================================================

/**
 * Zwraca stopień preferencji P(a,b) ∈ [0,1] dla danego kryterium.
 * Różnica `d` jest już zorientowana tak, że d > 0 oznacza, że a jest lepsze od b
 * (orientacja wykonywana w funkcji computePromethee z uwzględnieniem direction).
 */
function preferenceDegree(d: number, c: Criterion): number {
  if (d <= 0) return 0; // brak preferencji, gdy a nie jest lepsze
  const q = c.q ?? 0;
  const p = c.p ?? 0;
  const s = c.s ?? 0;

  switch (c.preference) {
    case "USUAL": // Typ I
      return d > 0 ? 1 : 0;

    case "USHAPE": // Typ II (próg obojętności q)
      return d > q ? 1 : 0;

    case "VSHAPE": // Typ III (liniowa do p)
      if (p <= 0) return d > 0 ? 1 : 0;
      return d >= p ? 1 : d / p;

    case "LEVEL": // Typ IV (q, p; schodkowa 0 / 0.5 / 1)
      if (d <= q) return 0;
      if (d <= p) return 0.5;
      return 1;

    case "LINEAR": // Typ V (liniowa między q a p)
      if (d <= q) return 0;
      if (d > p) return 1;
      if (p === q) return 1;
      return (d - q) / (p - q);

    case "GAUSSIAN": // Typ VI (gaussowska)
      if (s <= 0) return d > 0 ? 1 : 0;
      return 1 - Math.exp(-(d * d) / (2 * s * s));

    default:
      return d > 0 ? 1 : 0;
  }
}

// =========================================================================
// 4. PROMETHEE II
// =========================================================================

/**
 * Oblicza ranking PROMETHEE II.
 * @param matrix macierz decyzyjna
 * @param weights wektor wag (długość = liczba kryteriów). Zostanie znormalizowany do sumy 1.
 */
export function computePromethee(
  matrix: DecisionMatrix,
  weights: number[]
): PrometheeResult {
  const { alternatives, criteria, data } = matrix;
  const nAlt = alternatives.length;
  const nCrit = criteria.length;

  if (weights.length !== nCrit) {
    throw new Error(
      `Liczba wag (${weights.length}) musi odpowiadać liczbie kryteriów (${nCrit}).`
    );
  }

  // Normalizacja wag do sumy 1.
  const wSum = sum(weights);
  if (wSum <= 0) throw new Error("Suma wag musi być dodatnia.");
  const w = weights.map((x) => x / wSum);

  // Macierz agregowanych indeksów preferencji π(a,b).
  const pi: number[][] = Array.from({ length: nAlt }, () =>
    new Array(nAlt).fill(0)
  );

  // Profile jednokryterialne (do GAIA): unicriterion net flow φ_c(a).
  const uniNet: number[][] = Array.from({ length: nAlt }, () =>
    new Array(nCrit).fill(0)
  );

  for (let j = 0; j < nCrit; j++) {
    const c = criteria[j];
    // Składowa φ_c dla każdej alternatywy (przed normalizacją przez n-1).
    for (let a = 0; a < nAlt; a++) {
      let posC = 0;
      let negC = 0;
      for (let b = 0; b < nAlt; b++) {
        if (a === b) continue;
        // Orientacja różnicy zgodnie z kierunkiem kryterium.
        const raw = data[a][j] - data[b][j];
        const d = c.direction === "max" ? raw : -raw;
        const dRev = -d; // dla pary (b,a)
        const Pab = preferenceDegree(d, c);
        const Pba = preferenceDegree(dRev, c);
        pi[a][b] += w[j] * Pab;
        posC += Pab;
        negC += Pba;
      }
      // Jednokryterialny przepływ netto (znormalizowany przez n-1) — do GAIA.
      uniNet[a][j] = nAlt > 1 ? (posC - negC) / (nAlt - 1) : 0;
    }
  }

  // Przepływy globalne.
  const scores: PrometheeScore[] = alternatives.map((alt, a) => {
    let phiPlus = 0;
    let phiMinus = 0;
    for (let b = 0; b < nAlt; b++) {
      if (a === b) continue;
      phiPlus += pi[a][b];
      phiMinus += pi[b][a];
    }
    const denom = nAlt > 1 ? nAlt - 1 : 1;
    phiPlus /= denom;
    phiMinus /= denom;
    return {
      alternative: alt,
      phiPlus,
      phiMinus,
      phiNet: phiPlus - phiMinus,
      rank: 0,
    };
  });

  // Ranking wg φ netto (malejąco).
  const sorted = [...scores].sort((x, y) => y.phiNet - x.phiNet);
  sorted.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return { scores, unicriterionNetFlows: uniNet, weights: w };
}

// =========================================================================
// 5. CRITIC — obiektywne wagi (kontrast + konflikt/korelacja)
// =========================================================================

/**
 * Normalizacja min-max z uwzględnieniem kierunku kryterium.
 * Dla "max": (x - min) / (max - min); dla "min": (max - x) / (max - min).
 * Wynik w [0,1], gdzie większa wartość = lepsza.
 */
function normalizeMinMax(matrix: DecisionMatrix): number[][] {
  const { criteria, data } = matrix;
  const nAlt = data.length;
  const nCrit = criteria.length;
  const norm: number[][] = Array.from({ length: nAlt }, () =>
    new Array(nCrit).fill(0)
  );
  for (let j = 0; j < nCrit; j++) {
    const col = column(data, j);
    const min = Math.min(...col);
    const max = Math.max(...col);
    const range = max - min;
    for (let i = 0; i < nAlt; i++) {
      if (range === 0) {
        norm[i][j] = 1; // brak zróżnicowania -> stała
      } else if (criteria[j].direction === "max") {
        norm[i][j] = (data[i][j] - min) / range;
      } else {
        norm[i][j] = (max - data[i][j]) / range;
      }
    }
  }
  return norm;
}

/**
 * Wyznacza wagi metodą CRITIC.
 * Kroki: normalizacja min-max -> odchylenie std σ_j -> korelacje r_jk ->
 * ilość informacji C_j = σ_j · Σ_k (1 - r_jk) -> wagi w_j = C_j / Σ C.
 */
export function critic(matrix: DecisionMatrix): number[] {
  const norm = normalizeMinMax(matrix);
  const nCrit = matrix.criteria.length;

  const sigma: number[] = [];
  for (let j = 0; j < nCrit; j++) {
    sigma.push(stdDev(column(norm, j)));
  }

  const C: number[] = [];
  for (let j = 0; j < nCrit; j++) {
    let conflict = 0;
    for (let k = 0; k < nCrit; k++) {
      const r = pearson(column(norm, j), column(norm, k));
      conflict += 1 - r;
    }
    C.push(sigma[j] * conflict);
  }

  const total = sum(C);
  if (total === 0) {
    // Degeneracja: równe wagi.
    return new Array(nCrit).fill(1 / nCrit);
  }
  return C.map((c) => c / total);
}

// =========================================================================
// 6. MEREC — obiektywne wagi (efekt usunięcia kryterium)
// =========================================================================

/**
 * Normalizacja MEREC (liniowa, "im mniej tym lepiej" po transformacji):
 *  - benefit (max):  n_ij = min_i(x_ij) / x_ij
 *  - cost   (min):   n_ij = x_ij / max_i(x_ij)
 * Wartości muszą być dodatnie; w razie zer stosujemy małe epsilon.
 */
function normalizeMerec(matrix: DecisionMatrix): number[][] {
  const { criteria, data } = matrix;
  const nAlt = data.length;
  const nCrit = criteria.length;
  const eps = 1e-9;
  const norm: number[][] = Array.from({ length: nAlt }, () =>
    new Array(nCrit).fill(0)
  );
  for (let j = 0; j < nCrit; j++) {
    const col = column(data, j).map((v) => (v === 0 ? eps : v));
    const min = Math.min(...col);
    const max = Math.max(...col);
    for (let i = 0; i < nAlt; i++) {
      const x = col[i];
      if (criteria[j].direction === "max") {
        norm[i][j] = min / x;
      } else {
        norm[i][j] = x / max;
      }
    }
  }
  return norm;
}

/**
 * Wydajność alternatywy i wg MEREC: S_i = ln(1 + (1/m) Σ_j |ln(n_ij)|).
 * Mianownik `m` to LICZBA KRYTERIÓW (nie długość przekazanego wiersza) — wzór
 * źródłowy (Keshavarz-Ghorabaee 2021) używa 1/m w obu krokach: pełnym i
 * zredukowanym. Wyeksportowana do testów golden (jawna kontrola mianownika).
 */
export function merecPerformance(normRow: number[], m: number): number {
  const inner = sum(normRow.map((v) => Math.abs(Math.log(v)))) / m;
  return Math.log(1 + inner);
}

/**
 * Wyznacza wagi metodą MEREC.
 * Kroki: normalizacja -> S_i (z wszystkimi kryteriami) -> S'_ij (z usuniętym j) ->
 * efekt usunięcia E_j = Σ_i |S'_ij - S_i| -> wagi w_j = E_j / Σ E.
 */
export function merec(matrix: DecisionMatrix): number[] {
  const norm = normalizeMerec(matrix);
  const nAlt = norm.length;
  const nCrit = matrix.criteria.length;

  // S_i — pełna wydajność (mianownik = liczba kryteriów).
  const S: number[] = norm.map((row) => merecPerformance(row, nCrit));

  // S'_ij — wydajność po usunięciu kryterium j (mianownik nadal = liczba kryteriów).
  const E: number[] = new Array(nCrit).fill(0);
  for (let j = 0; j < nCrit; j++) {
    for (let i = 0; i < nAlt; i++) {
      const reduced = norm[i].filter((_, idx) => idx !== j);
      const Sij = merecPerformance(reduced, nCrit);
      E[j] += Math.abs(Sij - S[i]);
    }
  }

  const total = sum(E);
  if (total === 0) {
    return new Array(nCrit).fill(1 / nCrit);
  }
  return E.map((e) => e / total);
}

// =========================================================================
// 7. Funkcja wysokopoziomowa — wybór metody wag + ranking
// =========================================================================

export type WeightMethod = "critic" | "merec" | "manual" | "equal";

/**
 * Wyznacza wagi wskazaną metodą.
 * @param manualWeights wymagane tylko dla method = "manual".
 */
export function computeWeights(
  matrix: DecisionMatrix,
  method: WeightMethod,
  manualWeights?: number[]
): number[] {
  const nCrit = matrix.criteria.length;
  switch (method) {
    case "critic":
      return critic(matrix);
    case "merec":
      return merec(matrix);
    case "equal":
      return new Array(nCrit).fill(1 / nCrit);
    case "manual":
      if (!manualWeights || manualWeights.length !== nCrit) {
        throw new Error("Tryb 'manual' wymaga wektora wag o długości = liczbie kryteriów.");
      }
      return manualWeights;
    default:
      throw new Error(`Nieznana metoda wag: ${method}`);
  }
}

/** Wygodny wrapper: wyznacz wagi i policz PROMETHEE II w jednym kroku. */
export function rank(
  matrix: DecisionMatrix,
  method: WeightMethod,
  manualWeights?: number[]
): PrometheeResult {
  const weights = computeWeights(matrix, method, manualWeights);
  return computePromethee(matrix, weights);
}
