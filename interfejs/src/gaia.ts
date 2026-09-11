import type { PrometheeResult } from "../engine/promethee";

export interface GaiaResult {
  points: { alternative: string; x: number; y: number }[];
  axes: { criterion: string; x: number; y: number; weight: number }[];
  decisionAxis: { x: number; y: number };
  varianceExplained: number;
}

function matVec(A: number[][], v: number[]): number[] {
  const n = A.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) out[i] += A[i][j] * v[j];
  }
  return out;
}

function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function powerIteration(A: number[][]): { value: number; vector: number[] } {
  const n = A.length;
  let v = new Array(n).fill(1 / Math.sqrt(n));
  let value = 0;
  for (let iter = 0; iter < 500; iter++) {
    const w = matVec(A, v);
    const nw = norm(w);
    if (nw === 0) break;
    const vNext = w.map((x) => x / nw);
    value = vNext.reduce((s, x, i) => s + x * w[i], 0);
    let diff = 0;
    for (let i = 0; i < n; i++) diff = Math.max(diff, Math.abs(vNext[i] - v[i]));
    v = vNext;
    if (diff < 1e-12) break;
  }

  let mi = 0;
  for (let i = 1; i < n; i++) if (Math.abs(v[i]) > Math.abs(v[mi])) mi = i;
  if (v[mi] < 0) v = v.map((x) => -x);
  return { value, vector: v };
}

function topEigenvectors(
  A: number[][],
  k: number
): { values: number[]; vectors: number[][] } {
  const values: number[] = [];
  const vectors: number[][] = [];
  const M = A.map((row) => row.slice());
  for (let t = 0; t < k; t++) {
    const { value, vector } = powerIteration(M);
    values.push(value);
    vectors.push(vector);
    for (let i = 0; i < M.length; i++) {
      for (let j = 0; j < M.length; j++) {
        M[i][j] -= value * vector[i] * vector[j];
      }
    }
  }
  return { values, vectors };
}

export function gaia(result: PrometheeResult, criteriaNames: string[]): GaiaResult {
  const uni = result.unicriterionNetFlows;
  const weights = result.weights;
  const nAlt = uni.length;
  const nCrit = criteriaNames.length;

  const centered = uni.map((row) => row.slice());
  for (let j = 0; j < nCrit; j++) {
    let s = 0;
    for (let a = 0; a < nAlt; a++) s += uni[a][j];
    const mean = s / nAlt;
    for (let a = 0; a < nAlt; a++) centered[a][j] -= mean;
  }

  const G: number[][] = Array.from({ length: nCrit }, () => new Array(nCrit).fill(0));
  for (let j = 0; j < nCrit; j++) {
    for (let k = j; k < nCrit; k++) {
      let s = 0;
      for (let a = 0; a < nAlt; a++) s += centered[a][j] * centered[a][k];
      G[j][k] = s;
      G[k][j] = s;
    }
  }

  const { values, vectors } = topEigenvectors(G, 2);
  const u1 = vectors[0];
  const u2 = vectors[1];

  const points = result.scores.map((sc) => {
    const a = result.scores.findIndex((x) => x.alternative === sc.alternative);
    let x = 0;
    let y = 0;
    for (let j = 0; j < nCrit; j++) {
      x += centered[a][j] * u1[j];
      y += centered[a][j] * u2[j];
    }
    return { alternative: sc.alternative, x, y };
  });

  const axes = criteriaNames.map((name, j) => ({
    criterion: name,
    x: weights[j] * u1[j],
    y: weights[j] * u2[j],
    weight: weights[j],
  }));

  let dx = 0;
  let dy = 0;
  for (let j = 0; j < nCrit; j++) {
    dx += weights[j] * u1[j];
    dy += weights[j] * u2[j];
  }

  let trace = 0;
  for (let j = 0; j < nCrit; j++) trace += G[j][j];
  const varianceExplained = trace > 0 ? (values[0] + values[1]) / trace : 0;

  return {
    points,
    axes,
    decisionAxis: { x: dx, y: dy },
    varianceExplained,
  };
}
