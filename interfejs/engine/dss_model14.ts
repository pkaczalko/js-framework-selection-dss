/**
 * dss_model14.ts — warstwa danych modelu 14-kryterialnego DSS z wyborem wolumenu N.
 * ============================================================================
 * JAWNY, samodzielny model danych scenariuszow — zamiast recznych if-ow
 * rozsianych w komponentach UI. Jest to kanoniczny snapshot runtime modelu 14,
 * deterministycznie generowany ze zrodel analitycznych Etapu 4 i Etapu 5
 * (generator: generate_dss_model14_data.py). Pierwotne zrodla analityczne
 * (etap4/etap5) pozostaja autorytatywne; ten modul jest kanoniczna reprezentacja
 * runtime z jawną provenance, importowaną przez silnik.
 *
 * Zawiera:
 *  - zamrozena kolejnosc 14 kryteriow (readonly),
 *  - macierze danych 6x14 (N20 / N1000),
 *  - progi preferencji per-scenariusz (tbt, lcp, cls, total_byte_weight),
 *  - cztery manualne profile preferencji (niezalezne od wolumenu).
 *
 * Silnik `promethee.ts` pozostaje kryterio-agnostyczny i nietkniety.
 * CRITIC / MEREC sa przeliczane przez istniejacy silnik dla aktywnej macierzy
 * (funkcja getDecisionMatrix zwraca DecisionMatrix gotowa dla critic()/merec()).
 *
 * Domyślny wolumen: N20 (kompatybilnosc wsteczna z istniejacym 11-kryterialnym
 * promethee_input.json, ktore odpowiada scenariuszowi N20). N1000 jest jawnym
 * wyborem uzytkownika dla scenariusza duzego wolumenu (1000 artykulow).
 *
 * BEZPIECZENSTWO MUTACJI: getDecisionMatrix/getManualProfiles zwracaja GŁĘBOKIE
 * KOPIE tablic, tak aby modyfikacja wyniku jednego wywolania nie wplywala na
 * kolejne wywolanie ani na drugi scenariusz. Eksportowane stałe (kolejnosc/
 * alternatywy) sa as readonly.
 */
import type { DecisionMatrix, Criterion, PreferenceFunctionType, CriterionDirection } from "./promethee";
import data from "./migracja/dss_model14_data.json";

/** Wolumen danych (liczba artykulow aplikacji referencyjnej). */
export type DataVolume = "N20" | "N1000";

/** Domyślny wolumen — N20 dla kompatybilnosci wstecznej. */
export const DEFAULT_VOLUME: DataVolume = "N20";

/** Lista alternatyw (6). Readonly — nie mutowac w konsumentach. */
export const ALTERNATIVES: readonly string[] = data.alternatives as readonly string[];

/** Zamrozona kolejnosc 14 kryteriow. Readonly — nie mutowac w konsumentach. */
export const CRITERION_ORDER_14: readonly string[] = data.criterion_order as readonly string[];

/** Czytelna nazwa wolumenu do wyświetlenia w UI (bez słowa 'skala'). */
export function volumeLabel(v: DataVolume): string {
  return v === "N20"
    ? "Scenariusz N20 (umiarkowany wolumen, 20 artykułów)"
    : "Scenariusz N1000 (duży wolumen, 1000 artykułów)";
}

/** Krótki opis znaczenia wolumenu w kontekście obciążenia (bez słowa 'skala'). */
export function volumeDescription(v: DataVolume): string {
  return v === "N20"
    ? "Reprezentuje typowe obciążenie aplikacji o umiarkowanym wolumenie danych referencyjnych."
    : "Reprezentuje wysokie obciążenie przetwarzaniem dużej liczby rekordów DOM oraz pamięci.";
}

interface StaticThreshold { q: number; p: number; }
interface PerScenarioThreshold { N20: StaticThreshold; N1000: StaticThreshold; }
interface CriterionDef {
  key: string; name: string; direction: CriterionDirection;
  preference: PreferenceFunctionType;
  thresholds_per_scenario?: boolean;
  q?: number; p?: number;
  thresholds?: PerScenarioThreshold;
}

const CRITERIA_DEFS = data.criteria as unknown as CriterionDef[];

/** Gleboka kopia tablicy liczb (izolacja mutacji miedzy wywolaniami). */
function deepCopyRows(rows: number[][]): number[][] {
  return rows.map((r) => r.slice());
}

/**
 * Buduje macierz decyzyjna dla danego wolumenu: kryteria z progami
 * zmaterializowanymi dla aktywnego scenariusza + dane 6x14.
 * Zwraca GLEBOKIE KOPIE: alternatives i data sa nowymi tablicami, a kazdy
 * wiersz danych jest kopia, tak aby konsument nie mogl zmutowac wspolnego
 * stanu. Kryteria statyczne (bez thresholds_per_scenario) zachowuja ten sam q/p.
 */
export function getDecisionMatrix(volume: DataVolume): DecisionMatrix {
  const criteria: Criterion[] = CRITERIA_DEFS.map((c) => {
    const base: Criterion = {
      key: c.key,
      name: c.name,
      direction: c.direction,
      preference: c.preference,
    };
    if (c.thresholds_per_scenario) {
      const th = c.thresholds![volume];
      base.q = th.q;
      base.p = th.p;
    } else {
      base.q = c.q ?? 0;
      base.p = c.p ?? 0;
    }
    return base;
  });
  const mat = data.matrices as Record<DataVolume, Record<string, number[]>>;
  const sourceRows = ALTERNATIVES.map((alt) => mat[volume][alt]);
  return {
    alternatives: ALTERNATIVES.slice(),
    criteria,
    data: deepCopyRows(sourceRows),
  };
}

/**
 * Zwraca 4 manualne profile preferencji (niezalezne od wolumenu).
 * Kazdy wektor wag jest NOWA kopia, tak aby modyfikacja wyniku jednego
 * wywolania nie wplywala na kolejne wywolanie ani na inny profil.
 */
export function getManualProfiles(): Record<string, number[]> {
  const src = data.manual_profiles as unknown as Record<string, number[]>;
  const out: Record<string, number[]> = {};
  for (const k of Object.keys(src)) {
    out[k] = src[k].slice();
  }
  return out;
}

/** Nazwy 4 profili recznych. Readonly. */
export const MANUAL_PROFILE_NAMES: readonly string[] =
  Object.keys(data.manual_profiles) as readonly string[];

/** Lista kryteriow z progami per-scenariusz (zmieniaja sie z wolumenem). Readonly. */
export const PER_SCENARIO_CRITERIA: readonly string[] =
  CRITERIA_DEFS.filter((c) => c.thresholds_per_scenario).map((c) => c.key);

/** Lista kryteriow statycznych (q/p niezalezne od wolumenu). Readonly. */
export const STATIC_CRITERIA: readonly string[] =
  CRITERIA_DEFS.filter((c) => !c.thresholds_per_scenario).map((c) => c.key);

/**
 * Zwraca prog q,p dla kryterium w danym wolumenie (do diagnostyki UI).
 * Zwraca nowa pare, aby konsument nie mutowal wewnetrznego stanu progow.
 */
export function thresholdFor(key: string, volume: DataVolume): StaticThreshold {
  const c = CRITERIA_DEFS.find((x) => x.key === key);
  if (!c) throw new Error(`Nieznane kryterium: ${key}`);
  if (c.thresholds_per_scenario) {
    const th = c.thresholds![volume];
    return { q: th.q, p: th.p };
  }
  return { q: c.q ?? 0, p: c.p ?? 0 };
}
