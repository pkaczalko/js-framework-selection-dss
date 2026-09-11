import { getDecisionMatrix, getManualProfiles } from "../engine/dss_model14";
import { computePromethee } from "../engine/promethee";
import { gaia } from "./gaia";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const volume = "N20" as const;
const profile = "Enterprise";
const matrix = getDecisionMatrix(volume);
const weights = getManualProfiles()[profile];
const result = computePromethee(matrix, weights);
const g = gaia(result, matrix.criteria.map((c) => c.name));

const out = {
  volume,
  profile,
  varianceExplained: g.varianceExplained,
  points: g.points,
  axes: g.axes,
  decisionAxis: g.decisionAxis,
};
const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../engine/migracja/gaia_ts_output.json"
);
writeFileSync(outPath, JSON.stringify(out), "utf-8");
console.log("Zapisano:", outPath);
