import { create } from "zustand";
import * as trackingApi from "../api/tracking";

/* ── Types ── */

export interface DailyScore {
  date: string; // YYYY-MM-DD
  overall_score: number;
  moisture_norm: number;
  elasticity_norm: number;
  pore_norm: number;
  wrinkle_norm: number;
  pigmentation_norm: number;
  ma_7_score: number | null;
  trend_direction: "improving" | "stable" | "declining";
}

export interface ProductChangeEvent {
  date: string;
  category: string;
  previous_product: string;
  new_product: string;
  reason?: string;
}

export interface SkinSignal {
  type: "improvement" | "warning";
  title: string;
  description: string;
  metric?: string;
  date: string;
}

export type PeriodFilter = "1W" | "1M" | "3M" | "6M" | "1Y";

export type MetricKey =
  | "moisture_norm"
  | "elasticity_norm"
  | "pore_norm"
  | "wrinkle_norm"
  | "pigmentation_norm";

interface TrackingState {
  dailyScores: DailyScore[];
  productChanges: ProductChangeEvent[];
  signals: SkinSignal[];
  selectedPeriod: PeriodFilter;
  selectedMetric: MetricKey;
  isLoading: boolean;
  error: string | null;

  setPeriod: (p: PeriodFilter) => void;
  setMetric: (m: MetricKey) => void;
  getFilteredScores: () => DailyScore[];

  // API actions
  fetchScores: () => Promise<void>;
  fetchSignals: () => Promise<void>;
}

/* ── Period → API params mapping ── */

function getPeriodDays(period: PeriodFilter): number {
  switch (period) {
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "6M":
      return 180;
    case "1Y":
      return 365;
  }
}

function periodToApiPeriod(
  period: PeriodFilter,
): "daily" | "weekly" | "monthly" {
  switch (period) {
    case "1W":
    case "1M":
      return "daily";
    case "3M":
    case "6M":
      return "weekly";
    case "1Y":
      return "monthly";
  }
}

function getFromDate(period: PeriodFilter): string {
  const d = new Date();
  d.setDate(d.getDate() - getPeriodDays(period));
  return d.toISOString().split("T")[0];
}

/* ── Map API response to DailyScore ── */

function apiToDailyScore(
  r: trackingApi.DailySkinScoreResponse,
): DailyScore {
  return {
    date: r.score_date,
    overall_score: r.overall_score,
    moisture_norm: r.hydration_norm ?? 0,
    elasticity_norm: r.elasticity_norm ?? 0,
    pore_norm: r.pore_norm ?? 0,
    wrinkle_norm: r.wrinkle_norm ?? 0,
    pigmentation_norm: r.pigmentation_norm ?? 0,
    ma_7_score: r.ma_7_score ?? null,
    trend_direction: (r.trend_direction as DailyScore["trend_direction"]) ?? "stable",
  };
}

/* ── Map detection signals to SkinSignal[] ── */

const METRIC_LABELS: Record<string, string> = {
  hydration_norm: "수분",
  elasticity_norm: "탄력",
  pore_norm: "모공",
  wrinkle_norm: "주름",
  pigmentation_norm: "색소",
};

function detectionToSignals(
  det: trackingApi.DetectionSignalsResponse,
): SkinSignal[] {
  const signals: SkinSignal[] = [];

  // Improvement signals
  if (det.improvement.detected && det.improvement.improved_metrics) {
    for (const m of det.improvement.improved_metrics) {
      const label = METRIC_LABELS[m.metric] ?? m.metric;
      const changePct = Math.round(m.change_pct * 100);
      signals.push({
        type: "improvement",
        title: `${label} 점수 개선 감지!`,
        description: `평균 ${Math.round(m.before_mean * 100)} → ${Math.round(m.after_mean * 100)} (${changePct > 0 ? "+" : ""}${changePct}%)`,
        metric: m.metric,
        date: det.date,
      });
    }
  }

  // Product impact signals
  for (const p of det.product_impacts) {
    const dir = p.direction === "improved" ? "improvement" : "warning";
    signals.push({
      type: dir,
      title: `${p.product_name} 영향 감지`,
      description: `영향 확률 ${Math.round(p.impact_probability * 100)}% - ${p.affected_metrics.map((m) => METRIC_LABELS[m] ?? m).join(", ")}`,
      metric: p.affected_metrics[0],
      date: det.date,
    });
  }

  // Deterioration signals
  if (det.deterioration.level > 0) {
    const detData =
      det.deterioration.alert ??
      det.deterioration.warning ??
      det.deterioration.watch;
    if (detData?.deteriorated_metrics) {
      for (const m of detData.deteriorated_metrics) {
        const label = METRIC_LABELS[m.metric] ?? m.metric;
        signals.push({
          type: "warning",
          title: `${label} 점수 하락 추세`,
          description: `${label} 관리에 주의가 필요합니다.`,
          metric: m.metric,
          date: det.date,
        });
      }
    }
  }

  return signals;
}

/* ── Mock data generation (offline fallback) ── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateMockData(): {
  dailyScores: DailyScore[];
  productChanges: ProductChangeEvent[];
  signals: SkinSignal[];
} {
  const rand = seededRandom(42);
  const scores: DailyScore[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 89);

  const baseScore = 68;
  const baseMoisture = 0.65;
  const baseElasticity = 0.7;
  const basePore = 0.68;
  const baseWrinkle = 0.75;
  const basePigmentation = 0.6;

  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const drift = i * 0.08;
    const noise = (rand() - 0.5) * 8;
    const overall = Math.min(
      100,
      Math.max(40, Math.round(baseScore + drift + noise)),
    );

    let moistureBoost = 0;
    let pigBoost = 0;
    if (i >= 30) moistureBoost = 0.08;
    if (i >= 60) pigBoost = 0.05;

    const moisture = Math.min(1, Math.max(0, baseMoisture + i * 0.001 + moistureBoost + (rand() - 0.5) * 0.08));
    const elasticity = Math.min(1, Math.max(0, baseElasticity + i * 0.0005 + (rand() - 0.5) * 0.06));
    const pore = Math.min(1, Math.max(0, basePore - i * 0.0003 + (rand() - 0.5) * 0.07));
    const wrinkle = Math.min(1, Math.max(0, baseWrinkle + i * 0.0008 + (rand() - 0.5) * 0.05));
    const pigmentation = Math.min(1, Math.max(0, basePigmentation + i * 0.001 + pigBoost + (rand() - 0.5) * 0.06));

    scores.push({
      date: dateStr,
      overall_score: overall,
      moisture_norm: parseFloat(moisture.toFixed(3)),
      elasticity_norm: parseFloat(elasticity.toFixed(3)),
      pore_norm: parseFloat(pore.toFixed(3)),
      wrinkle_norm: parseFloat(wrinkle.toFixed(3)),
      pigmentation_norm: parseFloat(pigmentation.toFixed(3)),
      ma_7_score: null,
      trend_direction: "stable",
    });
  }

  // 7-day moving average
  for (let i = 0; i < scores.length; i++) {
    if (i >= 6) {
      let sum = 0;
      for (let j = i - 6; j <= i; j++) sum += scores[j].overall_score;
      scores[i].ma_7_score = parseFloat((sum / 7).toFixed(1));
    }
  }

  // Trend direction
  for (let i = 7; i < scores.length; i++) {
    const curr = scores[i].ma_7_score!;
    const prev = scores[i - 7].ma_7_score ?? scores[i - 7].overall_score;
    if (curr - prev > 2) scores[i].trend_direction = "improving";
    else if (curr - prev < -2) scores[i].trend_direction = "declining";
    else scores[i].trend_direction = "stable";
  }

  const change1Date = new Date(startDate);
  change1Date.setDate(change1Date.getDate() + 30);
  const change2Date = new Date(startDate);
  change2Date.setDate(change2Date.getDate() + 60);
  const change3Date = new Date(startDate);
  change3Date.setDate(change3Date.getDate() + 75);

  const productChanges: ProductChangeEvent[] = [
    { date: change1Date.toISOString().split("T")[0], category: "토너", previous_product: "아이소이 시카토너", new_product: "라운드랩 독도토너", reason: "다 써서" },
    { date: change2Date.toISOString().split("T")[0], category: "세럼", previous_product: "", new_product: "코스알엑스 스네일 96", reason: "추가" },
    { date: change3Date.toISOString().split("T")[0], category: "선크림", previous_product: "비오레 워터리 에센스", new_product: "이사녹스 톤업 선", reason: "리뉴얼 제품 출시" },
  ];

  const signals: SkinSignal[] = [
    { type: "improvement", title: "수분 점수 7일 연속 상승 중!", description: "꾸준한 수분 관리가 효과를 보고 있어요.", metric: "moisture", date: scores[scores.length - 1].date },
    { type: "improvement", title: "토너 교체 후 14일, 수분 +8점 개선", description: "라운드랩 독도토너가 피부 수분 유지에 효과적인 것 같습니다.", metric: "moisture", date: change1Date.toISOString().split("T")[0] },
    { type: "warning", title: "모공 점수 최근 5일 하락 추세", description: "모공 관리에 주의가 필요합니다.", metric: "pore", date: scores[scores.length - 1].date },
  ];

  return { dailyScores: scores, productChanges, signals };
}

const mockData = generateMockData();

/* ── Store ── */

export const useTrackingStore = create<TrackingState>((set, get) => ({
  dailyScores: mockData.dailyScores,
  productChanges: mockData.productChanges,
  signals: mockData.signals,
  selectedPeriod: "1M",
  selectedMetric: "moisture_norm",
  isLoading: false,
  error: null,

  setPeriod: (p) => {
    set({ selectedPeriod: p });
    // Re-fetch scores when period changes
    get().fetchScores();
  },
  setMetric: (m) => set({ selectedMetric: m }),

  getFilteredScores: () => {
    const { dailyScores, selectedPeriod } = get();
    const days = getPeriodDays(selectedPeriod);
    return dailyScores.slice(-days);
  },

  fetchScores: async () => {
    if (!localStorage.getItem("access_token")) return;
    const { selectedPeriod } = get();
    set({ isLoading: true, error: null });
    try {
      const responses = await trackingApi.getScores({
        period: periodToApiPeriod(selectedPeriod),
        from: getFromDate(selectedPeriod),
      });
      if (responses.length > 0) {
        set({
          dailyScores: responses.map(apiToDailyScore),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false, error: "점수 데이터를 불러오지 못했습니다." });
    }
  },

  fetchSignals: async () => {
    if (!localStorage.getItem("access_token")) return;
    try {
      const det = await trackingApi.getDetectionSignals();
      const signals = detectionToSignals(det);
      if (signals.length > 0) {
        set({ signals });
      }
    } catch {
      // keep existing signals (mock fallback)
    }
  },
}));
