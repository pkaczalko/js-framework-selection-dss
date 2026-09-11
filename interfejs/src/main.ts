import {
  getDecisionMatrix,
  getManualProfiles,
  volumeLabel,
  volumeDescription,
  DEFAULT_VOLUME,
  CRITERION_ORDER_14,
  type DataVolume,
} from "../engine/dss_model14";
import { computePromethee, critic, merec, type PrometheeResult } from "../engine/promethee";
import { Chart, registerables } from "chart.js";
import { gaia } from "./gaia";

Chart.register(...registerables);

type Mode = "wizard" | "critic" | "merec";

let volume: DataVolume = DEFAULT_VOLUME;
let mode: Mode = "wizard";

interface WizardAnswers {
  profile: string;
  team: "small" | "medium" | "large";
  performance: "low" | "normal" | "high";
  seo: "no" | "yes" | "neutral";
  maintenance: "short" | "long" | "neutral";
}

const answers: WizardAnswers = {
  profile: "Podstawowy",
  team: "medium",
  performance: "normal",
  seo: "neutral",
  maintenance: "neutral",
};

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  Podstawowy:
    "Profil ukierunkowany na łatwość wdrożenia i niski próg wejścia. Największy udział wagowy mają szybkość developmentu (w = 0,25), niski próg wejścia (w = 0,20) oraz dojrzałość ekosystemu (w = 0,15). Metryki laboratoryjne i nawigacyjne stanowią budżet drugorzędny (łączny budżet 0,12).",
  Enterprise:
    "Profil zorientowany na stabilność długoterminową i skalowalność organizacji. Priorytet stanowią skalowalność architektoniczna (w = 0,20), wsparcie LTS (w = 0,18) oraz dojrzałość ekosystemu (w = 0,12). Budżet metryk wydajnościowych wynosi 0,12.",
  Wydajność:
    "Profil kładący nacisk na optymalizację parametrów wykonawczych i zużycia zasobów. Metryki laboratoryjne i nawigacyjne stanowią 65% budżetu wag, w tym zużycie pamięci (w = 0,18) oraz parametry transferu sieciowego (po w = 0,11).",
  SEO:
    "Profil dedykowany aplikacjom treściowym o wysokich wymaganiach indeksowania. Kluczowe znaczenie przypisano wsparciu renderowania serwerowego SSR/SSG (w = 0,28), stabilności ekosystemu (w = 0,10) oraz wskaźnikom nawigacyjnym LCP, TBT i CLS (po w = 0,06).",
};

let chartNet: Chart | null = null;
let chartCrit: Chart | null = null;
let chartGaia: Chart | null = null;

const G_PERF = new Set(["bundle", "tbt", "memory", "lcp", "cls", "total_byte_weight"]);
const G_DX = new Set(["learn", "dev_speed"]);
const G_ECO = new Set(["ecosystem", "popular", "community", "lts"]);

function wizardWeights(): number[] {
  const base = getManualProfiles()[answers.profile].slice();
  for (let i = 0; i < CRITERION_ORDER_14.length; i++) {
    const key = CRITERION_ORDER_14[i];

    if (answers.team === "small") {
      if (G_DX.has(key)) base[i] *= 1.3;
      if (G_ECO.has(key)) base[i] *= 0.9;
    } else if (answers.team === "large") {
      if (G_DX.has(key)) base[i] *= 0.8;
      if (G_ECO.has(key)) base[i] *= 1.15;
    }

    if (answers.performance === "high" && G_PERF.has(key)) base[i] *= 1.4;
    if (answers.performance === "low" && G_PERF.has(key)) base[i] *= 0.7;

    if (key === "ssr") {
      if (answers.seo === "yes") base[i] *= 1.5;
      else if (answers.seo === "no") base[i] *= 0.5;
    }

    if (answers.maintenance === "long") {
      if (G_ECO.has(key)) base[i] *= 1.2;
      if (key === "lts") base[i] *= 1.3;
    } else if (answers.maintenance === "short" && G_ECO.has(key)) {
      base[i] *= 0.8;
    }
  }
  const total = base.reduce((a, b) => a + b, 0);
  return base.map((w) => w / total);
}

function weightsFor(): number[] {
  if (mode === "critic") return critic(getDecisionMatrix(volume));
  if (mode === "merec") return merec(getDecisionMatrix(volume));
  return wizardWeights();
}

function methodLabel(): string {
  if (mode === "critic") return "Metoda obiektywna CRITIC (na podstawie macierzy decyzyjnej)";
  if (mode === "merec") return "Metoda obiektywna MEREC (na podstawie efektu usunięcia kryteriów)";
  return `Kreator preferencji decydenta (profil bazowy: ${answers.profile})`;
}

const GREEN = "rgba(46,139,87,0.75)";
const RED = "rgba(205,92,92,0.75)";

function colorFor(values: number[]): string[] {
  return values.map((v) => (v >= 0 ? GREEN : RED));
}

function renderRanking(result: PrometheeResult): void {
  const tbody = document.querySelector<HTMLTableSectionElement>("#ranking-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const sorted = [...result.scores].sort((a, b) => a.rank - b.rank);
  for (const s of sorted) {
    const tr = document.createElement("tr");
    if (s.rank === 1) tr.className = "leader";
    tr.innerHTML =
      `<td>${s.rank}</td>` +
      `<td>${s.alternative}</td>` +
      `<td>${s.phiPlus.toFixed(4)}</td>` +
      `<td>${s.phiMinus.toFixed(4)}</td>` +
      `<td>${s.phiNet.toFixed(4)}</td>`;
    tbody.appendChild(tr);
  }
}

function renderNetChart(result: PrometheeResult): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#chart-net");
  if (!canvas) return;
  chartNet?.destroy();
  const labels = result.scores.map((s) => s.alternative);
  const data = result.scores.map((s) => Number(s.phiNet.toFixed(4)));
  chartNet = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "φ netto", data, backgroundColor: colorFor(data) }],
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Bilans przepływu netto φ (PROMETHEE II)" },
        legend: { display: false },
      },
      scales: {
        y: { title: { display: true, text: "Przepływ netto φ" } },
      },
    },
  });
}

function renderCriteriaChart(result: PrometheeResult, criteriaNames: string[]): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#chart-criteria");
  if (!canvas) return;
  chartCrit?.destroy();
  const leader = [...result.scores].sort((a, b) => a.rank - b.rank)[0];
  const idx = result.scores.findIndex((s) => s.alternative === leader.alternative);
  const uni = result.unicriterionNetFlows[idx].map((v) => Number(v.toFixed(4)));
  chartCrit = new Chart(canvas, {
    type: "bar",
    data: {
      labels: criteriaNames,
      datasets: [
        {
          label: `φ_c (${leader.alternative})`,
          data: uni,
          backgroundColor: colorFor(uni),
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        title: { display: true, text: `Wkład kryteriów jednokryterialnych φ_c — lider: ${leader.alternative}` },
        legend: { display: false },
      },
      scales: {
        x: { title: { display: true, text: "Wkład kryterium φ_c" } },
      },
    },
  });
}

function renderGaiaChart(result: PrometheeResult, criteriaNames: string[]): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#chart-gaia");
  if (!canvas) return;
  chartGaia?.destroy();
  const g = gaia(result, criteriaNames);

  const maxPointNorm = Math.max(...g.points.map((p) => Math.hypot(p.x, p.y)), 1e-9);
  const maxAxisNorm = Math.max(...g.axes.map((a) => Math.hypot(a.x, a.y)), 1e-9);
  const axisScale = (0.6 * maxPointNorm) / maxAxisNorm;

  const labels = g.points.map((p) => p.alternative);

  const pointDataset = {
    type: "scatter" as const,
    label: "Alternatywy",
    data: g.points.map((p) => ({ x: p.x, y: p.y })),
    backgroundColor: "rgba(46,139,87,1)",
    pointRadius: 6,
  };

  const axisDatasets = g.axes.map((a) => ({
    type: "line" as const,
    data: [
      { x: 0, y: 0 },
      { x: a.x * axisScale, y: a.y * axisScale },
    ],
    borderColor: "rgba(120,120,120,0.4)",
    borderWidth: 1,
    pointRadius: 0,
    showLine: true,
  }));

  const decisionDataset = {
    type: "line" as const,
    data: [
      { x: 0, y: 0 },
      { x: g.decisionAxis.x * axisScale, y: g.decisionAxis.y * axisScale },
    ],
    borderColor: "rgba(205,92,92,1)",
    borderWidth: 2,
    pointRadius: 0,
    showLine: true,
  };

  const labelPlugin = {
    id: "gaiaPointLabels",
    afterDatasetsDraw(chart: Chart) {
      const meta = chart.getDatasetMeta(0);
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = "#222";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      meta.data.forEach((el, i) => {
        ctx.fillText(labels[i], el.x, el.y - 12);
      });
      ctx.restore();
    },
  };

  chartGaia = new Chart(canvas, {
    type: "scatter",
    data: { datasets: [pointDataset, ...axisDatasets, decisionDataset] },
    options: {
      responsive: true,
      scales: {
        x: { type: "linear", position: "bottom" },
        y: { type: "linear" },
      },
      plugins: {
        title: {
          display: true,
          text: `Płaszczyzna głównych składowych GAIA (udział wariancji δ = ${(g.varianceExplained * 100).toFixed(1)}%)`,
        },
        legend: { display: false },
      },
    },
    plugins: [labelPlugin],
  });
}

function renderNote(): void {
  const note = document.querySelector<HTMLParagraphElement>("#note");
  if (!note) return;
  if (mode === "merec") {
    note.textContent =
      "Metoda MEREC wykazuje wysoką wrażliwość na zerowe wartości pomiarowe w macierzy decyzyjnej " +
      "(w scenariuszu N20: parametr TBT dla React; w scenariuszu N1000: parametr CLS dla Angular oraz Nuxt). " +
      "Wartości zerowe wymagają zastąpienia stałą regularyzacyjną ε, co skutkuje gwałtownym wzrostem wagi danego kryterium.";
  } else {
    note.textContent =
      "Ranking końcowy stanowi funkcję profilu preferencji decydenta oraz wolumenu danych testowych. " +
      "Żadna z analizowanych technologii nie wykazuje dominacji we wszystkich scenariuszach aplikacyjnych, " +
      "a optymalny wybór narzędzia zależy od specyfiki wymagań architektonicznych i organizacyjnych projektu.";
  }
}

let isCalculated: boolean = false;

function renderAll(): void {
  const volLabel = document.querySelector<HTMLElement>("#volume-label");
  const volDesc = document.querySelector<HTMLSpanElement>("#volume-desc");
  const methLabel = document.querySelector<HTMLElement>("#method-label");
  if (volLabel) volLabel.textContent = volumeLabel(volume);
  if (volDesc) volDesc.textContent = volumeDescription(volume);
  if (methLabel) methLabel.textContent = methodLabel();

  document.querySelector("#btn-critic")?.classList.toggle("active", mode === "critic");
  document.querySelector("#btn-merec")?.classList.toggle("active", mode === "merec");

  const resultsEmpty = document.querySelector<HTMLDivElement>("#results-empty");
  const resultsContent = document.querySelector<HTMLDivElement>("#results-content");

  if (!isCalculated) {
    if (resultsEmpty) resultsEmpty.style.display = "block";
    if (resultsContent) resultsContent.style.display = "none";
    return;
  }

  if (resultsEmpty) resultsEmpty.style.display = "none";
  if (resultsContent) resultsContent.style.display = "block";

  const matrix = getDecisionMatrix(volume);
  const result = computePromethee(matrix, weightsFor());

  renderRanking(result);
  renderNetChart(result);
  renderCriteriaChart(result, matrix.criteria.map((c) => c.name));
  renderGaiaChart(result, matrix.criteria.map((c) => c.name));
  renderNote();
}

function buildVolumeToggle(): void {
  const wrap = document.querySelector<HTMLDivElement>("#volume-buttons");
  if (!wrap) return;
  wrap.innerHTML = "";
  const volumes: { id: DataVolume; label: string }[] = [
    { id: "N20", label: "Scenariusz N20 (20 artykułów)" },
    { id: "N1000", label: "Scenariusz N1000 (1000 artykułów)" },
  ];
  for (const item of volumes) {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.dataset.volume = item.id;
    if (item.id === volume) btn.classList.add("active");
    btn.addEventListener("click", () => {
      volume = item.id;
      wrap.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderAll();
    });
    wrap.appendChild(btn);
  }
}

interface QuestionOption {
  label: string;
  value: string;
}

interface Question {
  id: keyof WizardAnswers;
  title: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: "profile",
    title: "1. Bazowy profil preferencji decydenta",
    options: [
      { label: "Podstawowy", value: "Podstawowy" },
      { label: "Enterprise", value: "Enterprise" },
      { label: "Wydajność", value: "Wydajność" },
      { label: "SEO", value: "SEO" },
    ],
  },
  {
    id: "team",
    title: "2. Wielkość zespołu deweloperskiego",
    options: [
      { label: "Mały (1–5 osób)", value: "small" },
      { label: "Średni (6–20 osób)", value: "medium" },
      { label: "Duży (ponad 20 osób)", value: "large" },
    ],
  },
  {
    id: "performance",
    title: "3. Priorytet wydajności wykonawczej",
    options: [
      { label: "Standardowy", value: "normal" },
      { label: "Krytyczny (wzmocnienie wag)", value: "high" },
      { label: "Niski (redukcja wag)", value: "low" },
    ],
  },
  {
    id: "seo",
    title: "4. Wymóg renderowania serwerowego (SSR/SSG)",
    options: [
      { label: "Standardowy (bez modyfikacji)", value: "neutral" },
      { label: "Wymagany (wzmocnienie SSR)", value: "yes" },
      { label: "Niewymagany (redukcja SSR)", value: "no" },
    ],
  },
  {
    id: "maintenance",
    title: "5. Horyzont czasowy utrzymania systemu",
    options: [
      { label: "Standardowy (bez modyfikacji)", value: "neutral" },
      { label: "Wieloletni (wzmocnienie LTS i ekosystemu)", value: "long" },
      { label: "Krótkoterminowy (redukcja ekosystemu)", value: "short" },
    ],
  },
];

function buildWizard(): void {
  const wrap = document.querySelector<HTMLDivElement>("#wizard");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (const q of QUESTIONS) {
    const card = document.createElement("div");
    card.className = "question";
    const heading = document.createElement("h3");
    heading.textContent = q.title;
    card.appendChild(heading);
    const row = document.createElement("div");
    row.className = "button-row";
    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      if (answers[q.id] === opt.value) btn.classList.add("active");
      btn.addEventListener("click", () => {
        (answers as unknown as Record<string, string>)[q.id] = opt.value;
        row.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
        if (q.id === "profile") {
          const desc = document.querySelector<HTMLParagraphElement>("#profile-description");
          if (desc) desc.textContent = PROFILE_DESCRIPTIONS[opt.value];
        }
        mode = "wizard";
        renderAll();
      });
      row.appendChild(btn);
    }
    card.appendChild(row);

    if (q.id === "profile") {
      const desc = document.createElement("p");
      desc.id = "profile-description";
      desc.className = "profile-description";
      desc.textContent = PROFILE_DESCRIPTIONS[answers.profile];
      card.appendChild(desc);
    }

    wrap.appendChild(card);
  }
}

function buildObjectiveButtons(): void {
  document.querySelector("#btn-critic")?.addEventListener("click", () => {
    mode = "critic";
    isCalculated = true;
    renderAll();
  });
  document.querySelector("#btn-merec")?.addEventListener("click", () => {
    mode = "merec";
    isCalculated = true;
    renderAll();
  });
}

function buildActionButtons(): void {
  document.querySelector("#btn-compute")?.addEventListener("click", () => {
    isCalculated = true;
    renderAll();
  });
}

function init(): void {
  buildVolumeToggle();
  buildWizard();
  buildObjectiveButtons();
  buildActionButtons();
  renderAll();
}

init();
